/**
 * Runner de migraciones, sin dependencias nuevas: Sequelize ya sabe hablar
 * con Postgres, así que basta con una tabla de control (`migraciones`) y una
 * lista ordenada de pasos con `up`/`down`. Se evitó `umzug` a propósito: trae
 * `@rushstack/ts-command-line` (para una CLI que no usamos) y esa cadena
 * arrastra `sprintf-js` vulnerable sin parche publicado -- el mismo tipo de
 * dependencia transitiva sin arreglo que el proyecto ya evitó dos veces con
 * `braces`/`micromatch` (ver CLAUDE.md, "Decisiones tomadas").
 *
 * Este runner es sólo el camino de producción. En desarrollo sigue
 * alcanzando `sequelize.sync({ alter: true })` (ver `index.ts`) para iterar
 * rápido sobre los modelos sin escribir una migración por cada cambio.
 */
import type { Sequelize, Transaction } from 'sequelize';
import { QueryTypes } from 'sequelize';

export interface Migracion {
  /** Único y ordenable: convención `NNNN_descripcion`. */
  nombre: string;
  up(sequelize: Sequelize, transaction: Transaction): Promise<void>;
  down(sequelize: Sequelize, transaction: Transaction): Promise<void>;
}

const TABLA_CONTROL = 'migraciones';

async function asegurarTablaControl(sequelize: Sequelize): Promise<void> {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS ${TABLA_CONTROL} (
      nombre VARCHAR(255) PRIMARY KEY,
      ejecutada_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
  `);
}

async function obtenerAplicadas(sequelize: Sequelize): Promise<string[]> {
  await asegurarTablaControl(sequelize);
  const filas = await sequelize.query<{ nombre: string }>(
    `SELECT nombre FROM ${TABLA_CONTROL} ORDER BY nombre ASC`,
    { type: QueryTypes.SELECT },
  );
  return filas.map((f) => f.nombre);
}

function ordenadas(migraciones: Migracion[]): Migracion[] {
  return [...migraciones].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function estado(
  sequelize: Sequelize,
  migraciones: Migracion[],
): Promise<{ aplicadas: string[]; pendientes: string[] }> {
  const aplicadas = await obtenerAplicadas(sequelize);
  const aplicadasSet = new Set(aplicadas);
  const pendientes = ordenadas(migraciones)
    .filter((m) => !aplicadasSet.has(m.nombre))
    .map((m) => m.nombre);
  return { aplicadas, pendientes };
}

/** Corre todas las migraciones pendientes, en orden, cada una en su propia transacción. */
export async function subir(sequelize: Sequelize, migraciones: Migracion[]): Promise<string[]> {
  const { pendientes } = await estado(sequelize, migraciones);
  const porNombre = new Map(migraciones.map((m) => [m.nombre, m]));
  const corridas: string[] = [];

  for (const nombre of pendientes) {
    const migracion = porNombre.get(nombre);
    if (!migracion) continue;
    await sequelize.transaction(async (transaction) => {
      await migracion.up(sequelize, transaction);
      await sequelize.query(`INSERT INTO ${TABLA_CONTROL} (nombre) VALUES (:nombre)`, {
        replacements: { nombre },
        transaction,
      });
    });
    corridas.push(nombre);
  }
  return corridas;
}

/** Deshace sólo la última migración aplicada. */
export async function bajarUltima(
  sequelize: Sequelize,
  migraciones: Migracion[],
): Promise<string | null> {
  const { aplicadas } = await estado(sequelize, migraciones);
  const ultimo = aplicadas[aplicadas.length - 1];
  if (!ultimo) return null;

  const migracion = migraciones.find((m) => m.nombre === ultimo);
  if (!migracion) {
    throw new Error(
      `La migración "${ultimo}" está marcada como aplicada pero no existe en el código.`,
    );
  }

  await sequelize.transaction(async (transaction) => {
    await migracion.down(sequelize, transaction);
    await sequelize.query(`DELETE FROM ${TABLA_CONTROL} WHERE nombre = :nombre`, {
      replacements: { nombre: ultimo },
      transaction,
    });
  });
  return ultimo;
}

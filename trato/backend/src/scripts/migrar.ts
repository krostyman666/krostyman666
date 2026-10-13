/**
 * CLI de migraciones. A diferencia de `seed-socios.ts`, esto corre contra
 * producción -- no llama a `sequelize.sync()` en ningún caso.
 *
 * Uso (ver scripts en package.json):
 *   npm run migrate -w @trato/backend          # aplica las pendientes
 *   npm run migrate:estado -w @trato/backend    # lista aplicadas y pendientes
 *   npm run migrate:deshacer -w @trato/backend  # deshace sólo la última
 */
import { conectarBaseDatos, sequelize } from '../config/database';
import { migraciones } from '../db/migraciones';
import { estado, subir, bajarUltima } from '../db/migrador';

async function main(): Promise<void> {
  const comando = process.argv[2] ?? 'up';
  await conectarBaseDatos();

  switch (comando) {
    case 'up': {
      const corridas = await subir(sequelize, migraciones);
      if (corridas.length === 0) {
        console.warn('No había migraciones pendientes.');
      } else {
        console.warn('Aplicadas:', corridas.join(', '));
      }
      break;
    }
    case 'down': {
      const deshecha = await bajarUltima(sequelize, migraciones);
      console.warn(deshecha ? `Deshecha: ${deshecha}` : 'No había nada que deshacer.');
      break;
    }
    case 'status': {
      const { aplicadas, pendientes } = await estado(sequelize, migraciones);
      console.warn('Aplicadas:', aplicadas.length ? aplicadas.join(', ') : '(ninguna)');
      console.warn('Pendientes:', pendientes.length ? pendientes.join(', ') : '(ninguna)');
      break;
    }
    default:
      throw new Error(`Comando desconocido: "${comando}". Usa up, down o status.`);
  }

  await sequelize.close();
}

main().catch((error) => {
  console.error('Falló la migración:', error);
  process.exit(1);
});

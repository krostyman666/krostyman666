/**
 * Datos de prueba para desarrollo. Los nombres son ficticios: al incorporar
 * notarías y conservadores reales hay que cargarlos desde su nómina oficial.
 *
 * Uso: npx ts-node src/scripts/seed-socios.ts
 */
import { conectarBaseDatos, sequelize } from '../config/database';
import { Socio } from '../models/Socio';
import { Usuario, hashearPassword } from '../models/Usuario';
import '../models/Propiedad';
import '../models/Documento';

const RM = 'Metropolitana de Santiago';

const SOCIOS = [
  { tipo: 'notaria' as const, nombre: 'Notaría de prueba Centro', comuna: 'Santiago', region: RM },
  { tipo: 'notaria' as const, nombre: 'Notaría de prueba Oriente', comuna: 'Providencia', region: RM },
  { tipo: 'conservador' as const, nombre: 'Conservador de prueba Santiago', comuna: 'Santiago', region: RM },
];

async function main(): Promise<void> {
  await conectarBaseDatos();
  await sequelize.sync({ alter: true });

  for (const datos of SOCIOS) {
    const [socio, creado] = await Socio.findOrCreate({
      where: { nombre: datos.nombre },
      defaults: datos,
    });
    console.warn(`${creado ? 'creado' : 'ya existía'}: ${socio.nombre}`);

    if (datos.tipo === 'notaria') {
      const email = `${datos.nombre.toLowerCase().replace(/[^a-z]+/g, '.')}@trato.cl`;
      const [usuario, nuevo] = await Usuario.findOrCreate({
        where: { email },
        defaults: {
          email,
          passwordHash: await hashearPassword('clave-notaria-1'),
          nombre: 'Equipo',
          apellido: datos.nombre.replace('Notaría de prueba ', ''),
          rut: datos.comuna === 'Santiago' ? '16273849-6' : '18927364-9',
          telefono: null,
          rol: 'notaria',
          socioId: socio.id,
        },
      });
      if (!nuevo && usuario.socioId !== socio.id) {
        await usuario.update({ socioId: socio.id });
      }
      console.warn(`  usuario ${email} (clave: clave-notaria-1)`);
    }
  }

  await sequelize.close();
}

main().catch((error) => {
  console.error('Falló el seed:', error);
  process.exit(1);
});

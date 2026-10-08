import { Sequelize } from 'sequelize';
// Sequelize carga el dialecto de Postgres con un require dinámico en tiempo
// de ejecución. El empaquetador de funciones serverless de Vercel traza sólo
// imports estáticos, así que sin esta línea deja `pg` fuera del bundle aunque
// esté instalado, y la función revienta con "Please install pg package
// manually" apenas se crea el Sequelize.
import 'pg';
import { env, esProduccion } from './env';

export const sequelize = new Sequelize(env.databaseUrl, {
  dialect: 'postgres',
  logging: esProduccion ? false : (msg) => console.warn(msg),
  pool: { max: env.dbPoolMax, min: 0, acquire: 30000, idle: 10000 },
  define: {
    underscored: true,
    timestamps: true,
  },
});

export async function conectarBaseDatos(): Promise<void> {
  await sequelize.authenticate();
}

import { Sequelize } from 'sequelize';
import { env, esProduccion } from './env';

export const sequelize = new Sequelize(env.databaseUrl, {
  dialect: 'postgres',
  logging: esProduccion ? false : (msg) => console.warn(msg),
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  define: {
    underscored: true,
    timestamps: true,
  },
});

export async function conectarBaseDatos(): Promise<void> {
  await sequelize.authenticate();
}

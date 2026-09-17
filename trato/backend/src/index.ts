import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { env, esProduccion } from './config/env';
import { conectarBaseDatos, sequelize } from './config/database';
import authRoutes from './routes/auth.routes';
import propiedadesRoutes from './routes/propiedades.routes';
import { manejarErrores, rutaNoEncontrada } from './middleware/manejarErrores';
import './models/Usuario';
import './models/Propiedad';
import './models/Documento';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(morgan(esProduccion ? 'combined' : 'dev'));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ estado: 'ok', hora: new Date().toISOString() });
});

app.get('/api/v1', (_req, res) => {
  res.json({ servicio: 'Trato API', version: '0.1.0' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/propiedades', propiedadesRoutes);

app.use(rutaNoEncontrada);
app.use(manejarErrores);

async function iniciar(): Promise<void> {
  await conectarBaseDatos();

  if (!esProduccion) {
    await sequelize.sync({ alter: true });
  }

  app.listen(env.port, () => {
    console.warn(`Trato API escuchando en http://localhost:${env.port}`);
  });
}

if (require.main === module) {
  iniciar().catch((error) => {
    console.error('No se pudo iniciar la API:', error);
    process.exit(1);
  });
}

export default app;

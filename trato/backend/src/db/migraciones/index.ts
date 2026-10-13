import type { Migracion } from '../migrador';
import baseline from './0001_baseline';

// Lista explícita, no un escaneo de directorio: cada migración nueva se
// agrega acá a mano, en orden, igual que se agregan los imports de modelos
// en index.ts. Evita depender de que el nombre de archivo compile igual en
// tsx (dev, lee .ts) y en dist (node, lee .js).
export const migraciones: Migracion[] = [baseline];

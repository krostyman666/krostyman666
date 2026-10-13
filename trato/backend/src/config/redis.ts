import { createClient, type RedisClientType } from 'redis';
import { env } from './env';

export function redisConfigurado(): boolean {
  return Boolean(env.redis.url);
}

let cliente: RedisClientType | null = null;
let conectando: Promise<RedisClientType> | null = null;

/**
 * Conexión única por proceso, creada recién al primer uso -- no al importar
 * el módulo, para que nada intente hablar con Redis si `REDIS_URL` está
 * vacío (ver `redisConfigurado`). El listener de 'error' es obligatorio:
 * sin él, un error de red en el cliente de `redis` v6 revienta el proceso
 * entero en vez de rechazar sólo la llamada que lo disparó.
 */
export async function obtenerClienteRedis(): Promise<RedisClientType> {
  if (cliente) return cliente;
  if (!conectando) {
    const nuevo = createClient({ url: env.redis.url });
    nuevo.on('error', (error) => {
      console.error('Error de conexión a Redis:', error);
    });
    conectando = nuevo.connect().then(() => {
      cliente = nuevo;
      return nuevo;
    });
  }
  return conectando;
}

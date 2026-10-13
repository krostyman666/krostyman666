/**
 * Límite de intentos para `/registro` e `/ingreso`, con contador en Redis en
 * vez de memoria del proceso. Sin esto, escalar a más de una instancia
 * multiplica el límite real por instancia -- cada una cuenta aparte (ver
 * CLAUDE.md, "Seguridad"). Se escribió un store propio, chico, en vez de
 * sumar `rate-limit-redis`: esa librería exige `express-rate-limit >= 8` por
 * peer dependency, y el proyecto está en la 7.x -- subir de versión mayor
 * sólo para esto no vale el riesgo de romper algo que ya funciona.
 */
import rateLimit, { type Store, type ClientRateLimitInfo } from 'express-rate-limit';
import { obtenerClienteRedis, redisConfigurado } from '../config/redis';

const PREFIJO_CLAVE = 'trato:rate-limit:';

/**
 * Ventana fija: INCR + "expira si es el primer hit de la ventana", el mismo
 * algoritmo que usa `rate-limit-redis`. `decrement`/`resetKey` existen
 * porque el tipo `Store` los exige, aunque esta configuración (sin
 * `skipFailedRequests`/`skipSuccessfulRequests`) nunca llega a llamarlos.
 */
class AlmacenRedis implements Store {
  localKeys = false;
  private ventanaMs = 15 * 60 * 1000;

  init(opciones: { windowMs: number }): void {
    this.ventanaMs = opciones.windowMs;
  }

  async increment(clave: string): Promise<ClientRateLimitInfo> {
    const cliente = await obtenerClienteRedis();
    const claveRedis = PREFIJO_CLAVE + clave;
    const totalHits = await cliente.incr(claveRedis);
    if (totalHits === 1) {
      await cliente.pExpire(claveRedis, this.ventanaMs);
    }
    const ttl = await cliente.pTTL(claveRedis);
    return {
      totalHits,
      resetTime: ttl >= 0 ? new Date(Date.now() + ttl) : undefined,
    };
  }

  async decrement(clave: string): Promise<void> {
    const cliente = await obtenerClienteRedis();
    const claveRedis = PREFIJO_CLAVE + clave;
    if (await cliente.exists(claveRedis)) {
      await cliente.decr(claveRedis);
    }
  }

  async resetKey(clave: string): Promise<void> {
    const cliente = await obtenerClienteRedis();
    await cliente.del(PREFIJO_CLAVE + clave);
  }
}

export const limiteIntentos = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: redisConfigurado() ? new AlmacenRedis() : undefined,
  message: {
    error: 'Demasiados intentos. Espera unos minutos.',
    codigo: 'demasiados_intentos',
  },
});

import type { Router } from 'express';
import { ErrorApi } from '../utils/ErrorApi';

const PATRON_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function esIdDeRutaValido(valor: string): boolean {
  return PATRON_UUID.test(valor);
}

/**
 * Todos los parámetros de ruta que identifican un registro son UUID (ver
 * `grep -rohE "/:[a-zA-Z]+Id|/:id" src/routes` para la lista completa). Sin
 * esto, un id mal formado -- "undefined" llegando de un bug en el cliente,
 * un bookmark viejo, alguien probando la API a mano -- revienta recién
 * dentro del servicio con el error crudo de Postgres ("invalid input syntax
 * for type uuid"), capturado por el manejador genérico como un 500
 * `error_interno`: igual de opaco para quien llama que un error real del
 * servidor, y ensucia los logs con "errores" que en realidad son un id
 * inválido. `app.param` corre antes que cualquier handler de ruta que use
 * ese nombre -- pero sólo en el router donde se registra: Express no hereda
 * los callbacks de `param` de un router a los que monta (ver
 * https://expressjs.com/en/guide/routing.html#route-parameters, "Param
 * callback functions are... not inherited by mounted apps or routers").
 * Como cada recurso vive en su propio `express.Router()` (`propiedadesRoutes`,
 * `informesRoutes`, etc.), hay que registrarlo en cada uno -- `app.param`
 * por sí solo no alcanza, porque ninguna ruta real está montada directo
 * sobre `app`. Primer intento real: se registró sólo en `app` y el chequeo
 * nunca corrió -- confirmado probando `/api/v1/informes/undefined`, que
 * siguió llegando intacto hasta `autenticar`. El resultado (404
 * `no_encontrado`) es el mismo que ya usan los servicios cuando el id es
 * válido pero no existe: quien llama no puede distinguir "mal formado" de
 * "no existe", y no hace falta que pueda.
 */
const PARAMETROS_UUID = [
  'id',
  'propiedadId',
  'documentoId',
  'informeId',
  'pagoId',
  'promesaId',
  'clausulaId',
  'visitaId',
  'mensajeId',
];

export function registrarValidacionDeIds(...routers: Router[]): void {
  for (const router of routers) {
    for (const nombre of PARAMETROS_UUID) {
      router.param(nombre, (_req, _res, next, valor: string) => {
        if (!esIdDeRutaValido(valor)) {
          next(ErrorApi.noEncontrado('Recurso no encontrado'));
          return;
        }
        next();
      });
    }
  }
}

import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestMethods,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

/**
 * Acciones de Trato para un flujo de n8n. No incluye la consulta a SII ni a
 * Tesorería -- eso lo arma el flujo con nodos HTTP/scraping propios, porque es
 * trabajo de automatización sobre un portal público, no una API de Trato. Este
 * nodo sólo lee la cola de propiedades pendientes y empuja de vuelta lo que el
 * flujo haya consultado. Ver backend/src/services/integraciones.service.ts.
 */
export class Trato implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Trato',
    name: 'trato',
    icon: 'file:trato.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Lee propiedades pendientes y empuja avalúo fiscal / contribuciones a Trato',
    defaults: { name: 'Trato' },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [{ name: 'tratoApi', required: true }],
    properties: [
      {
        displayName: 'Operación',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Listar propiedades pendientes',
            value: 'listarPendientes',
            description: 'Propiedades con rol de avalúo pero sin dato fresco de un tipo',
            action: 'Listar propiedades pendientes',
          },
          {
            name: 'Actualizar avalúo fiscal',
            value: 'actualizarAvaluoFiscal',
            description: 'Guarda el avalúo fiscal consultado por rol en sii.cl',
            action: 'Actualizar avalúo fiscal',
          },
          {
            name: 'Actualizar contribuciones',
            value: 'actualizarContribuciones',
            description: 'Guarda las cuotas de contribuciones consultadas por rol en tesoreria.cl',
            action: 'Actualizar contribuciones',
          },
        ],
        default: 'listarPendientes',
      },

      // --- listarPendientes ---
      {
        displayName: 'Tipo',
        name: 'tipo',
        type: 'options',
        options: [
          { name: 'Avalúo fiscal', value: 'avaluo_fiscal' },
          { name: 'Contribuciones', value: 'contribuciones' },
        ],
        default: 'avaluo_fiscal',
        displayOptions: { show: { operation: ['listarPendientes'] } },
      },

      // --- propiedadId (las dos operaciones de escritura) ---
      {
        displayName: 'ID de la propiedad',
        name: 'propiedadId',
        type: 'string',
        default: '',
        required: true,
        description: 'El id de Trato, no el rol. Viene de "Listar propiedades pendientes".',
        displayOptions: {
          show: { operation: ['actualizarAvaluoFiscal', 'actualizarContribuciones'] },
        },
      },

      // --- actualizarAvaluoFiscal ---
      {
        displayName: 'Avalúo total (CLP)',
        name: 'avaluoTotal',
        type: 'number',
        default: 0,
        required: true,
        displayOptions: { show: { operation: ['actualizarAvaluoFiscal'] } },
      },
      {
        displayName: 'Avalúo exento (CLP)',
        name: 'avaluoExento',
        type: 'number',
        default: 0,
        required: true,
        displayOptions: { show: { operation: ['actualizarAvaluoFiscal'] } },
      },
      {
        displayName: 'Avalúo afecto (CLP)',
        name: 'avaluoAfecto',
        type: 'number',
        default: 0,
        required: true,
        displayOptions: { show: { operation: ['actualizarAvaluoFiscal'] } },
      },
      {
        displayName: 'Vigencia',
        name: 'vigencia',
        type: 'string',
        default: '',
        placeholder: '2026-2',
        required: true,
        description: 'Semestre de vigencia tal como lo informa el SII',
        displayOptions: { show: { operation: ['actualizarAvaluoFiscal'] } },
      },

      // --- actualizarContribuciones ---
      {
        displayName: 'Cuotas',
        name: 'cuotas',
        type: 'json',
        default: '[]',
        required: true,
        description:
          'Array de {"periodo","monto","vencimiento","estado"}, estado en pagada|pendiente|atrasada',
        displayOptions: { show: { operation: ['actualizarContribuciones'] } },
      },
      {
        displayName: 'Total adeudado (CLP)',
        name: 'totalAdeudadoClp',
        type: 'number',
        default: 0,
        required: true,
        displayOptions: { show: { operation: ['actualizarContribuciones'] } },
      },
      {
        displayName: '¿Al día?',
        name: 'alDia',
        type: 'boolean',
        default: true,
        displayOptions: { show: { operation: ['actualizarContribuciones'] } },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const salida: INodeExecutionData[] = [];

    const credenciales = await this.getCredentials('tratoApi');
    const baseUrl = (credenciales.baseUrl as string).replace(/\/+$/, '');

    for (let i = 0; i < items.length; i++) {
      const operation = this.getNodeParameter('operation', i) as string;

      let method: IHttpRequestMethods = 'GET';
      let url = '';
      let body: Record<string, unknown> | undefined;

      if (operation === 'listarPendientes') {
        const tipo = this.getNodeParameter('tipo', i) as string;
        method = 'GET';
        url = `${baseUrl}/integraciones/propiedades-pendientes?tipo=${encodeURIComponent(tipo)}`;
      } else if (operation === 'actualizarAvaluoFiscal') {
        const propiedadId = this.getNodeParameter('propiedadId', i) as string;
        method = 'PATCH';
        url = `${baseUrl}/integraciones/propiedades/${encodeURIComponent(propiedadId)}/avaluo-fiscal`;
        body = {
          avaluoTotal: this.getNodeParameter('avaluoTotal', i),
          avaluoExento: this.getNodeParameter('avaluoExento', i),
          avaluoAfecto: this.getNodeParameter('avaluoAfecto', i),
          vigencia: this.getNodeParameter('vigencia', i),
        };
      } else if (operation === 'actualizarContribuciones') {
        const propiedadId = this.getNodeParameter('propiedadId', i) as string;
        method = 'PATCH';
        url = `${baseUrl}/integraciones/propiedades/${encodeURIComponent(propiedadId)}/contribuciones`;
        const cuotasCrudas = this.getNodeParameter('cuotas', i);
        const cuotas = typeof cuotasCrudas === 'string' ? JSON.parse(cuotasCrudas) : cuotasCrudas;
        body = {
          cuotas,
          totalAdeudadoClp: this.getNodeParameter('totalAdeudadoClp', i),
          alDia: this.getNodeParameter('alDia', i),
        };
      } else {
        throw new NodeOperationError(this.getNode(), `Operación desconocida: ${operation}`);
      }

      try {
        const respuesta = await this.helpers.httpRequestWithAuthentication.call(this, 'tratoApi', {
          method,
          url,
          body,
          json: true,
        });
        salida.push({ json: respuesta as IDataObject });
      } catch (error) {
        if (this.continueOnFail()) {
          salida.push({ json: { error: (error as Error).message } });
          continue;
        }
        throw error;
      }
    }

    return [salida];
  }
}

import type { ICredentialType, INodeProperties, IAuthenticateGeneric } from 'n8n-workflow';

/**
 * Llave fija, no un login de usuario: quien llama es un flujo automatizado, no
 * una persona de la operación (vendedor, comprador, asesor, notaría). Trato la
 * valida contra `INTEGRACION_API_KEY` del backend -- ver
 * `backend/src/middleware/autenticarIntegracion.ts`.
 */
export class TratoApi implements ICredentialType {
  name = 'tratoApi';
  displayName = 'Trato API';
  documentationUrl = 'https://github.com/krostyman666/krostyman666';

  properties: INodeProperties[] = [
    {
      displayName: 'URL base de la API',
      name: 'baseUrl',
      type: 'string',
      default: 'http://localhost:3001/api/v1',
      description: 'Sin barra al final. En producción, la URL pública del backend de Trato.',
    },
    {
      displayName: 'Llave de integración',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'La misma que INTEGRACION_API_KEY en el .env del backend.',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'x-integracion-key': '={{$credentials.apiKey}}',
      },
    },
  };
}

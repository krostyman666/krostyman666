type FlowModule = typeof import('./flow.service');

async function cargarFlowService(apiKey: string, secretKey: string): Promise<FlowModule> {
  process.env.FLOW_API_KEY = apiKey;
  process.env.FLOW_SECRET_KEY = secretKey;
  jest.resetModules();
  return import('./flow.service');
}

function mockFetch(impl: () => Promise<{ ok: boolean; status?: number; json: () => Promise<unknown> }>) {
  (global as unknown as { fetch: jest.Mock }).fetch = jest.fn(impl);
}

const SECRET_FIXTURE = 'test-secret-key-fixture';

describe('firmar', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.FLOW_API_KEY;
    delete process.env.FLOW_SECRET_KEY;
  });

  // Fixture calculado con el mismo algoritmo que describe la documentación
  // de Flow (HMAC-SHA256 hex de los parámetros ordenados alfabéticamente y
  // concatenados como clave+valor), corrido una vez con Node `crypto` -- no
  // adivinado -- para confirmar que `firmar` hace exactamente eso.
  it('firma los parámetros de crear orden igual que el algoritmo documentado por Flow', async () => {
    const { firmar } = await cargarFlowService('ABC123', SECRET_FIXTURE);
    const parametros = {
      apiKey: 'ABC123',
      commerceOrder: 'pago-1',
      subject: 'Informe de titulos',
      currency: 'CLP',
      amount: 49000,
      email: 'comprador@example.com',
      urlConfirmation: 'https://trato-backend.vercel.app/api/v1/pagos/flow/confirmacion',
      urlReturn: 'https://trato.cl/propiedades/abc',
    };
    expect(firmar(parametros)).toBe(
      'dd7e963615a45ce689175b7cc1efab17a28dc683fa4360e7e0716a4832e808ea',
    );
  });

  it('firma los parámetros de getStatus igual que el algoritmo documentado por Flow', async () => {
    const { firmar } = await cargarFlowService('ABC123', SECRET_FIXTURE);
    expect(firmar({ apiKey: 'ABC123', token: 'tok-xyz' })).toBe(
      'f4f36812b4ca96aab8723ea2352439c41787a6d31521ad5dadc00135557ca4fa',
    );
  });

  it('el orden de las claves en el objeto no cambia la firma: siempre se ordenan alfabéticamente', async () => {
    const { firmar } = await cargarFlowService('ABC123', SECRET_FIXTURE);
    const a = firmar({ apiKey: 'ABC123', token: 'tok-xyz' });
    const b = firmar({ token: 'tok-xyz', apiKey: 'ABC123' });
    expect(a).toBe(b);
  });
});

describe('estaConfigurado', () => {
  afterEach(() => {
    delete process.env.FLOW_API_KEY;
    delete process.env.FLOW_SECRET_KEY;
  });

  it('es falso sin credenciales', async () => {
    const { estaConfigurado } = await cargarFlowService('', '');
    expect(estaConfigurado()).toBe(false);
  });

  it('es verdadero con apiKey y secretKey', async () => {
    const { estaConfigurado } = await cargarFlowService('ABC123', SECRET_FIXTURE);
    expect(estaConfigurado()).toBe(true);
  });
});

describe('crearOrdenPago', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.FLOW_API_KEY;
    delete process.env.FLOW_SECRET_KEY;
  });

  it('devuelve la orden cuando Flow responde bien', async () => {
    const { crearOrdenPago } = await cargarFlowService('ABC123', SECRET_FIXTURE);
    mockFetch(async () => ({
      ok: true,
      json: async () => ({ url: 'https://sandbox.flow.cl/app/web/pay.php', token: 'tok-1', flowOrder: 999 }),
    }));
    const orden = await crearOrdenPago({
      commerceOrder: 'pago-1',
      subject: 'Informe',
      amount: 49000,
      email: 'comprador@example.com',
      urlConfirmation: 'https://x/confirmacion',
      urlReturn: 'https://x/return',
    });
    expect(orden).toEqual({ url: 'https://sandbox.flow.cl/app/web/pay.php', token: 'tok-1', flowOrder: 999 });
  });

  it('lanza un error de conflicto cuando Flow rechaza la orden', async () => {
    const { crearOrdenPago } = await cargarFlowService('ABC123', SECRET_FIXTURE);
    mockFetch(async () => ({ ok: false, status: 400, json: async () => ({ code: 101, message: 'Invalid apiKey' }) }));
    await expect(
      crearOrdenPago({
        commerceOrder: 'pago-1',
        subject: 'Informe',
        amount: 49000,
        email: 'comprador@example.com',
        urlConfirmation: 'https://x/confirmacion',
        urlReturn: 'https://x/return',
      }),
    ).rejects.toMatchObject({ codigo: 'flow_rechazo' });
  });
});

describe('consultarEstado', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.FLOW_API_KEY;
    delete process.env.FLOW_SECRET_KEY;
  });

  it('devuelve el estado cuando Flow responde bien', async () => {
    const { consultarEstado } = await cargarFlowService('ABC123', SECRET_FIXTURE);
    mockFetch(async () => ({
      ok: true,
      json: async () => ({ flowOrder: 999, commerceOrder: 'pago-1', status: 2, amount: 49000 }),
    }));
    const estado = await consultarEstado('tok-1');
    expect(estado.status).toBe(2);
  });
});

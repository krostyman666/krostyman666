type UfModule = typeof import('./uf.service');

async function cargarUfService(): Promise<UfModule> {
  jest.resetModules();
  return import('./uf.service');
}

function mockFetch(impl: () => Promise<{ ok: boolean; status?: number; json: () => Promise<unknown> }>) {
  (global as unknown as { fetch: jest.Mock }).fetch = jest.fn(impl);
}

const RESPUESTA_OK = {
  serie: [
    { fecha: '2026-10-06T03:00:00.000Z', valor: 41106.35 },
    { fecha: '2026-10-05T03:00:00.000Z', valor: 41098.15 },
  ],
};

describe('obtenerUf', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('devuelve el último valor de la serie de mindicador.cl cuando responde bien', async () => {
    const { obtenerUf } = await cargarUfService();
    mockFetch(async () => ({ ok: true, json: async () => RESPUESTA_OK }));
    const uf = await obtenerUf();
    expect(uf).toEqual({ valorClp: 41106.35, fecha: '2026-10-06T03:00:00.000Z', fuente: 'mindicador' });
  });

  it('cachea: una segunda llamada dentro de la vigencia no vuelve a pedirlo', async () => {
    const { obtenerUf } = await cargarUfService();
    mockFetch(async () => ({ ok: true, json: async () => RESPUESTA_OK }));
    await obtenerUf();
    await obtenerUf();
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(1);
  });

  it('usa el fallback fijo si nunca hubo una consulta exitosa', async () => {
    const { obtenerUf } = await cargarUfService();
    mockFetch(async () => {
      throw new Error('network down');
    });
    const uf = await obtenerUf();
    expect(uf.fuente).toBe('fallback');
    expect(uf.valorClp).toBeGreaterThan(0);
  });

  it('con la respuesta de mindicador.cl mal formada, también cae al fallback', async () => {
    const { obtenerUf } = await cargarUfService();
    mockFetch(async () => ({ ok: true, json: async () => ({ serie: [] }) }));
    const uf = await obtenerUf();
    expect(uf.fuente).toBe('fallback');
  });

  it('vencida la caché, sirve el último valor real conocido en vez del fallback si la nueva consulta falla', async () => {
    const { obtenerUf } = await cargarUfService();
    const ahoraSpy = jest.spyOn(Date, 'now');

    ahoraSpy.mockReturnValue(1_000_000_000_000);
    mockFetch(async () => ({ ok: true, json: async () => RESPUESTA_OK }));
    const primero = await obtenerUf();
    expect(primero.fuente).toBe('mindicador');

    ahoraSpy.mockReturnValue(1_000_000_000_000 + 7 * 60 * 60 * 1000); // +7h: venció la caché de 6h
    mockFetch(async () => {
      throw new Error('network down');
    });
    const segundo = await obtenerUf();
    expect(segundo.valorClp).toBe(primero.valorClp);
    expect(segundo.fuente).toBe('mindicador');
  });
});

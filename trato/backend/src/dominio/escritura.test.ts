import { motivoParaEscriturar, motivoParaInscribir } from './escritura';

describe('motivoParaEscriturar', () => {
  it('bloquea si no hay promesa firmada, aunque el expediente esté listo', () => {
    const motivo = motivoParaEscriturar({ hayPromesaFirmada: false, expedienteListo: true });
    expect(motivo).toMatch(/promesa firmada/);
  });

  it('bloquea si el expediente no está listo, aunque haya promesa firmada', () => {
    const motivo = motivoParaEscriturar({ hayPromesaFirmada: true, expedienteListo: false });
    expect(motivo).toMatch(/expediente/);
  });

  it('no bloquea cuando la promesa está firmada y el expediente listo', () => {
    expect(motivoParaEscriturar({ hayPromesaFirmada: true, expedienteListo: true })).toBeNull();
  });
});

describe('motivoParaInscribir', () => {
  it('bloquea si la escritura no está conforme', () => {
    expect(motivoParaInscribir(false)).toMatch(/escritura de compraventa/);
  });

  it('no bloquea si la escritura está conforme', () => {
    expect(motivoParaInscribir(true)).toBeNull();
  });
});

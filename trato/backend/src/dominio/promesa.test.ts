import {
  clausulasObligatorias,
  cumpleElArticulo,
  DatosParaVerificar,
  estaCompleta,
  marcadoresPendientes,
  verificar1554,
} from './promesa';

const DATOS_COMPLETOS: DatosParaVerificar = {
  tienePrecio: true,
  tieneFormaPago: true,
  tieneIndividualizacion: true,
  tienePlazoOCondicion: true,
  hipotecaSinResolver: false,
};

describe('clausulasObligatorias', () => {
  it('no incluye el alzamiento si la propiedad no tiene hipoteca', () => {
    const codigos = clausulasObligatorias(false).map((c) => c.codigo);
    expect(codigos).not.toContain('alzamiento');
    expect(codigos).toContain('individualizacion');
    expect(codigos).toContain('precio_y_pago');
    expect(codigos).toContain('plazo');
  });

  it('incluye el alzamiento si la propiedad tiene hipoteca', () => {
    const codigos = clausulasObligatorias(true).map((c) => c.codigo);
    expect(codigos).toContain('alzamiento');
  });

  it('todas las obligatorias son de tipo obligatoria', () => {
    for (const c of clausulasObligatorias(true)) {
      expect(c.tipo).toBe('obligatoria');
    }
  });
});

describe('verificar1554', () => {
  it('cumple los cuatro requisitos cuando todos los datos están completos', () => {
    const resultado = verificar1554(DATOS_COMPLETOS);
    expect(resultado).toHaveLength(4);
    expect(resultado.every((r) => r.cumplido)).toBe(true);
    expect(resultado.every((r) => r.falta === null)).toBe(true);
  });

  it('falla contrato_eficaz si hay hipoteca sin resolver', () => {
    const resultado = verificar1554({ ...DATOS_COMPLETOS, hipotecaSinResolver: true });
    const req = resultado.find((r) => r.codigo === 'contrato_eficaz')!;
    expect(req.cumplido).toBe(false);
    expect(req.falta).toMatch(/hipoteca/);
  });

  it('falla plazo_o_condicion si falta el plazo', () => {
    const resultado = verificar1554({ ...DATOS_COMPLETOS, tienePlazoOCondicion: false });
    const req = resultado.find((r) => r.codigo === 'plazo_o_condicion')!;
    expect(req.cumplido).toBe(false);
    expect(req.falta).toMatch(/fecha límite/);
  });

  it('falla contrato_especificado y lista cada dato faltante', () => {
    const resultado = verificar1554({
      ...DATOS_COMPLETOS,
      tienePrecio: false,
      tieneFormaPago: false,
      tieneIndividualizacion: false,
    });
    const req = resultado.find((r) => r.codigo === 'contrato_especificado')!;
    expect(req.cumplido).toBe(false);
    expect(req.falta).toContain('la individualización del inmueble');
    expect(req.falta).toContain('el precio');
    expect(req.falta).toContain('la forma de pago');
  });

  it('por_escrito siempre está cumplido, nace escrita por construcción', () => {
    const resultado = verificar1554(DATOS_COMPLETOS);
    const req = resultado.find((r) => r.codigo === 'por_escrito')!;
    expect(req.cumplido).toBe(true);
  });
});

describe('cumpleElArticulo', () => {
  it('es true sólo si los cuatro requisitos están cumplidos', () => {
    expect(cumpleElArticulo(DATOS_COMPLETOS)).toBe(true);
  });

  it('es false si falta cualquiera de los requisitos', () => {
    expect(cumpleElArticulo({ ...DATOS_COMPLETOS, tienePrecio: false })).toBe(false);
    expect(cumpleElArticulo({ ...DATOS_COMPLETOS, hipotecaSinResolver: true })).toBe(false);
    expect(cumpleElArticulo({ ...DATOS_COMPLETOS, tienePlazoOCondicion: false })).toBe(false);
  });
});

describe('marcadoresPendientes', () => {
  it('encuentra todos los marcadores entre llaves', () => {
    expect(marcadoresPendientes('El precio es {precio} y el pie {pie}.')).toEqual(['precio', 'pie']);
  });

  it('devuelve una lista vacía si no hay marcadores', () => {
    expect(marcadoresPendientes('El precio es $100.000.000 y el pie $10.000.000.')).toEqual([]);
  });

  it('no se confunde con otros caracteres especiales', () => {
    expect(marcadoresPendientes('100% del {porcentaje}% del precio.')).toEqual(['porcentaje']);
  });
});

describe('estaCompleta', () => {
  it('es true cuando no quedan marcadores sin llenar', () => {
    expect(estaCompleta('El inmueble se entrega el día 2026-12-01.')).toBe(true);
  });

  it('es false si queda al menos un marcador', () => {
    expect(estaCompleta('El inmueble se entrega el día {fecha}.')).toBe(false);
  });
});

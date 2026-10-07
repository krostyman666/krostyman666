import {
  diaIsoChileno,
  diaSemanaChileno,
  horaDePared,
  instanteChileno,
  minutosDeHora,
  sumarDias,
} from './tiempo';

/**
 * Las fechas de cambio de hora de abajo no están inventadas: se confirmaron
 * contra el propio motor de zonas horarias de este runtime (America/Santiago
 * pasa de GMT-3 a GMT-4 la madrugada del 5 de abril de 2026, y de GMT-4 a
 * GMT-3 la madrugada del 6 de septiembre de 2026). Si algún día cambia la ley
 * del horario de invierno en Chile, estos números hay que revisarlos contra
 * el runtime, no a ojo.
 */
describe('instanteChileno', () => {
  it('convierte una hora de verano (GMT-3) al instante UTC correcto', () => {
    // 4 de abril, 20:00 en Chile, todavía en horario de verano (GMT-3).
    expect(instanteChileno(2026, 4, 4, 20, 0).toISOString()).toBe('2026-04-04T23:00:00.000Z');
  });

  it('convierte una hora de invierno (GMT-4) al instante UTC correcto', () => {
    // 5 de abril, 10:00 en Chile, ya en horario de invierno (GMT-4).
    expect(instanteChileno(2026, 4, 5, 10, 0).toISOString()).toBe('2026-04-05T14:00:00.000Z');
  });

  it('no corre una hora las visitas de uno y otro lado del cambio de abril', () => {
    const antes = instanteChileno(2026, 4, 4, 20, 0);
    const despues = instanteChileno(2026, 4, 5, 10, 0);
    // Entre las 20:00 del día 4 y las 10:00 del día 5 pasan 14 horas de reloj
    // chileno, pero como el reloj retrocedió una hora esa noche, en UTC son 15.
    const horas = (despues.getTime() - antes.getTime()) / 3_600_000;
    expect(horas).toBe(15);
  });

  it('convierte correctamente antes y después del cambio de septiembre', () => {
    // 5 de septiembre, 20:00, todavía en horario de invierno (GMT-4).
    expect(instanteChileno(2026, 9, 5, 20, 0).toISOString()).toBe('2026-09-06T00:00:00.000Z');
    // 6 de septiembre, 10:00, ya en horario de verano (GMT-3).
    expect(instanteChileno(2026, 9, 6, 10, 0).toISOString()).toBe('2026-09-06T13:00:00.000Z');
  });
});

describe('horaDePared / instanteChileno, ida y vuelta', () => {
  it('recupera la misma hora de pared para un instante sin ambigüedad de DST', () => {
    const instante = instanteChileno(2026, 6, 15, 14, 30);
    expect(horaDePared(instante)).toEqual({ ano: 2026, mes: 6, dia: 15, hora: 14, minuto: 30 });
  });
});

describe('diaSemanaChileno', () => {
  it('da el día de la semana según el calendario chileno, no el UTC', () => {
    // 2026-09-17 23:30 hora de Chile (GMT-3) es jueves; en UTC ya es viernes
    // 2026-09-18 02:30, así que un cálculo que no pase por la zona horaria
    // se equivocaría de día.
    const instante = instanteChileno(2026, 9, 17, 23, 30);
    expect(diaSemanaChileno(instante)).toBe(4); // jueves
  });
});

describe('diaIsoChileno', () => {
  it('arma el ISO del día chileno al que pertenece el instante, no el UTC', () => {
    // Mismo caso: 23:30 del 17 en Chile ya es 18 en UTC.
    const instante = instanteChileno(2026, 9, 17, 23, 30);
    expect(diaIsoChileno(instante)).toBe('2026-09-17');
  });

  it('rellena con ceros mes y día de un dígito', () => {
    const instante = instanteChileno(2026, 1, 5, 12, 0);
    expect(diaIsoChileno(instante)).toBe('2026-01-05');
  });
});

describe('sumarDias', () => {
  it('corre el día calendario sin tocar la hora de pared', () => {
    const dia = { ano: 2026, mes: 1, dia: 30, hora: 14, minuto: 0 };
    expect(sumarDias(dia, 3)).toEqual({ ano: 2026, mes: 2, dia: 2, hora: 14, minuto: 0 });
  });

  it('cruza de año correctamente', () => {
    const dia = { ano: 2026, mes: 12, dia: 30, hora: 9, minuto: 15 };
    expect(sumarDias(dia, 3)).toEqual({ ano: 2027, mes: 1, dia: 2, hora: 9, minuto: 15 });
  });
});

describe('minutosDeHora', () => {
  it('convierte "HH:MM" y "HH:MM:SS" a minutos desde medianoche', () => {
    expect(minutosDeHora('14:30')).toBe(870);
    expect(minutosDeHora('14:30:00')).toBe(870);
    expect(minutosDeHora('09:05')).toBe(545);
    expect(minutosDeHora('00:00')).toBe(0);
  });
});

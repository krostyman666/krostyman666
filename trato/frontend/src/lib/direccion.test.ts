import { describe, expect, it } from 'vitest';
import { direccionDesdeLugar, normalizarRegion } from './direccion';

describe('normalizarRegion', () => {
  it('saca el prefijo "Región de " y hace calzar contra el enum', () => {
    expect(normalizarRegion('Región de Valparaíso')).toBe('Valparaíso');
    expect(normalizarRegion('Región de Ñuble')).toBe('Ñuble');
    expect(normalizarRegion('Región de Atacama')).toBe('Atacama');
  });

  it('saca el prefijo genérico "Región " cuando no es "de"/"del"', () => {
    expect(normalizarRegion('Región Metropolitana de Santiago')).toBe('Metropolitana de Santiago');
  });

  it('calza por substring cuando Google da el nombre corto (verificado en vivo: Places API New devuelve "Región Metropolitana", sin "de Santiago")', () => {
    expect(normalizarRegion('Región Metropolitana')).toBe('Metropolitana de Santiago');
  });

  it('saca el prefijo "Región del "', () => {
    expect(normalizarRegion("Región del Libertador General Bernardo O'Higgins")).toBe(
      "Libertador General Bernardo O'Higgins",
    );
    expect(normalizarRegion('Región del Biobío')).toBe('Biobío');
  });

  it('no distingue mayúsculas ni acentos', () => {
    expect(normalizarRegion('region de valparaiso')).toBe('Valparaíso');
    expect(normalizarRegion('REGIÓN DE ANTOFAGASTA')).toBe('Antofagasta');
  });

  it('devuelve null si no calza con nada del enum, en vez de adivinar', () => {
    expect(normalizarRegion('Región de Marte')).toBeNull();
    expect(normalizarRegion('')).toBeNull();
  });
});

describe('direccionDesdeLugar', () => {
  // Fixture tomado de una respuesta real de Place Autocomplete (New) para
  // "Av. Apoquindo 3000, Las Condes" (ver CLAUDE.md, sección Google Maps):
  // Google devuelve `administrative_area_level_1` = "Región Metropolitana",
  // no "...de Santiago".
  it('arma calle, número, comuna, región y coordenadas desde addressComponents', () => {
    const lugar = {
      addressComponents: [
        { longText: '3000', shortText: '3000', types: ['street_number'] },
        { longText: 'Avenida Apoquindo', shortText: 'Av. Apoquindo', types: ['route'] },
        { longText: 'Las Condes', shortText: 'Las Condes', types: ['locality', 'political'] },
        {
          longText: 'Las Condes',
          shortText: 'Las Condes',
          types: ['administrative_area_level_3', 'political'],
        },
        {
          longText: 'Región Metropolitana',
          shortText: 'RM',
          types: ['administrative_area_level_1', 'political'],
        },
      ],
      location: { lat: () => -33.4170498, lng: () => -70.5987974 },
    };

    expect(direccionDesdeLugar(lugar)).toEqual({
      calle: 'Avenida Apoquindo',
      numero: '3000',
      comuna: 'Las Condes',
      region: 'Metropolitana de Santiago',
      latitud: -33.4170498,
      longitud: -70.5987974,
    });
  });

  it('cae a locality si no hay administrative_area_level_3', () => {
    const lugar = {
      addressComponents: [
        { longText: 'Pueblo Chico', shortText: 'Pueblo Chico', types: ['locality'] },
      ],
    };
    expect(direccionDesdeLugar(lugar).comuna).toBe('Pueblo Chico');
  });

  it('devuelve null en los campos que no vinieron, sin inventar nada', () => {
    expect(direccionDesdeLugar({})).toEqual({
      calle: null,
      numero: null,
      comuna: null,
      region: null,
      latitud: null,
      longitud: null,
    });
  });
});

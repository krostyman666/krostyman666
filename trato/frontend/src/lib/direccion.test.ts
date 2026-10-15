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
  it('arma calle, número, comuna, región y coordenadas desde address_components', () => {
    const lugar = {
      address_components: [
        { long_name: 'Pedro de Valdivia', short_name: 'Av. Pedro de Valdivia', types: ['route'] },
        { long_name: '1234', short_name: '1234', types: ['street_number'] },
        { long_name: 'Providencia', short_name: 'Providencia', types: ['administrative_area_level_3'] },
        {
          long_name: 'Región Metropolitana de Santiago',
          short_name: 'RM',
          types: ['administrative_area_level_1'],
        },
      ],
      geometry: { location: { lat: () => -33.4263, lng: () => -70.6128 } },
    };

    expect(direccionDesdeLugar(lugar)).toEqual({
      calle: 'Pedro de Valdivia',
      numero: '1234',
      comuna: 'Providencia',
      region: 'Metropolitana de Santiago',
      latitud: -33.4263,
      longitud: -70.6128,
    });
  });

  it('cae a locality si no hay administrative_area_level_3', () => {
    const lugar = {
      address_components: [
        { long_name: 'Pueblo Chico', short_name: 'Pueblo Chico', types: ['locality'] },
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

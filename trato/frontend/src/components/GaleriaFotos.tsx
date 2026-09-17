'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';

interface Props {
  fotos: string[];
  titulo: string;
}

export default function GaleriaFotos({ fotos, titulo }: Props) {
  const [actual, setActual] = useState(0);

  if (fotos.length === 0) {
    return (
      <div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-tinta/20 bg-tinta/[0.02]">
        <Camera className="h-8 w-8 text-tinta-tenue/60" strokeWidth={1.5} />
        <p className="max-w-xs text-center text-sm text-tinta-tenue">
          Esta publicación todavía no tiene fotos. Agendamos la sesión fotográfica con el
          vendedor.
        </p>
      </div>
    );
  }

  const mover = (paso: number) => {
    setActual((i) => (i + paso + fotos.length) % fotos.length);
  };

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-tinta/5">
        {/* Las fotos son URLs que carga el vendedor, así que no pasan por el
            optimizador de Next: no se pueden enumerar los dominios de antemano. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fotos[actual]}
          alt={`${titulo} — foto ${actual + 1} de ${fotos.length}`}
          className="h-full w-full object-cover"
        />

        {fotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => mover(-1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-tinta shadow-carta transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => mover(1)}
              aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-tinta shadow-carta transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-tinta/75 px-2.5 py-1 text-xs font-medium tabular-nums text-white">
              {actual + 1} / {fotos.length}
            </span>
          </>
        )}
      </div>

      {fotos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {fotos.map((foto, i) => (
            <button
              key={foto}
              type="button"
              onClick={() => setActual(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === actual}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                i === actual ? 'ring-trato-600' : 'ring-transparent hover:ring-tinta/20'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

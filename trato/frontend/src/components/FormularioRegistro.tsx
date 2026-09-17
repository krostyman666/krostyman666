'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, guardarToken, mensajeDeError } from '@/lib/api';
import { esRutValido, formatearRut, limpiarRut } from '@/lib/rut';

const esquema = z.object({
  nombre: z.string().trim().min(2, 'Mínimo 2 caracteres'),
  apellido: z.string().trim().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Revisa el correo'),
  rut: z.string().refine(esRutValido, 'El RUT no es válido'),
  telefono: z.string().trim().max(20).optional().or(z.literal('')),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type Campos = z.infer<typeof esquema>;

export default function FormularioRegistro() {
  const router = useRouter();
  const params = useSearchParams();
  const rol = params?.get('tipo') === 'vendedor' ? 'vendedor' : 'comprador';
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Campos>({ resolver: zodResolver(esquema) });

  async function enviar(datos: Campos) {
    setErrorServidor(null);
    try {
      const { data } = await api.post('/auth/registro', {
        ...datos,
        rut: limpiarRut(datos.rut),
        telefono: datos.telefono || undefined,
        rol,
      });
      guardarToken(data.token);
      router.push('/panel');
    } catch (error) {
      setErrorServidor(mensajeDeError(error));
    }
  }

  const clasesInput =
    'w-full rounded-xl border border-tinta/15 px-4 py-3 text-tinta outline-none transition focus:border-trato-500 focus:ring-2 focus:ring-trato-100';

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo etiqueta="Nombre" error={errors.nombre?.message}>
          <input {...register('nombre')} className={clasesInput} autoComplete="given-name" />
        </Campo>
        <Campo etiqueta="Apellido" error={errors.apellido?.message}>
          <input {...register('apellido')} className={clasesInput} autoComplete="family-name" />
        </Campo>
      </div>

      <Campo etiqueta="Correo" error={errors.email?.message}>
        <input {...register('email')} type="email" className={clasesInput} autoComplete="email" />
      </Campo>

      <Campo etiqueta="RUT" error={errors.rut?.message}>
        <input
          {...register('rut')}
          className={clasesInput}
          placeholder="12.345.678-9"
          inputMode="text"
          onBlur={(e) => {
            const limpio = limpiarRut(e.target.value);
            if (limpio) setValue('rut', formatearRut(limpio), { shouldValidate: true });
          }}
        />
      </Campo>

      <Campo etiqueta="Teléfono (opcional)" error={errors.telefono?.message}>
        <input {...register('telefono')} className={clasesInput} autoComplete="tel" placeholder="+56 9 ..." />
      </Campo>

      <Campo etiqueta="Clave" error={errors.password?.message}>
        <input
          {...register('password')}
          type="password"
          className={clasesInput}
          autoComplete="new-password"
        />
      </Campo>

      {errorServidor && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorServidor}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-trato-600 px-6 py-3.5 font-semibold text-white transition hover:bg-trato-700 disabled:opacity-60"
      >
        {isSubmitting ? 'Creando cuenta...' : `Crear cuenta de ${rol}`}
      </button>

      <p className="text-center text-xs leading-relaxed text-tinta-tenue">
        Al crear tu cuenta aceptas que usemos tu RUT para las gestiones legales de la compraventa.
      </p>
    </form>
  );
}

function Campo({
  etiqueta,
  error,
  children,
}: {
  etiqueta: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-tinta-suave">{etiqueta}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

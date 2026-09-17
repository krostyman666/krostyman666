'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, guardarToken, mensajeDeError } from '@/lib/api';

const esquema = z.object({
  email: z.string().email('Revisa el correo'),
  password: z.string().min(1, 'Escribe tu clave'),
});

type Campos = z.infer<typeof esquema>;

export default function FormularioIngreso() {
  const router = useRouter();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Campos>({ resolver: zodResolver(esquema) });

  async function enviar(datos: Campos) {
    setErrorServidor(null);
    try {
      const { data } = await api.post('/auth/ingreso', datos);
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
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-tinta-suave">Correo</span>
        <input {...register('email')} type="email" autoComplete="email" className={clasesInput} />
        {errors.email && (
          <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span>
        )}
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-tinta-suave">Clave</span>
        <input
          {...register('password')}
          type="password"
          autoComplete="current-password"
          className={clasesInput}
        />
        {errors.password && (
          <span className="mt-1 block text-xs text-red-600">{errors.password.message}</span>
        )}
      </label>

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
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}

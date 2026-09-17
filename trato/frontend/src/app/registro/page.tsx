import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import FormularioRegistro from '@/components/FormularioRegistro';

export const metadata: Metadata = {
  title: 'Crear cuenta | Trato',
  description: 'Crea tu cuenta para comprar o vender tu propiedad de trato directo.',
};

export default function RegistroPage() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-trato-50/60 to-white">
      <header className="mx-auto w-full max-w-6xl px-4 py-6">
        <Link href="/" className="text-xl font-bold tracking-tight text-tinta">
          Trato<span className="text-trato-600">.</span>
        </Link>
      </header>

      <div className="mx-auto w-full max-w-md flex-1 px-4 pb-16">
        <h1 className="text-3xl font-bold tracking-tight text-tinta">Crea tu cuenta</h1>
        <p className="mt-2 text-tinta-suave">
          Primero el informe de tu propiedad. Sin costo y sin compromiso.
        </p>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-carta ring-1 ring-tinta/5 sm:p-8">
          <Suspense fallback={<p className="text-sm text-tinta-tenue">Cargando...</p>}>
            <FormularioRegistro />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-sm text-tinta-suave">
          ¿Ya tienes cuenta?{' '}
          <Link href="/ingresar" className="font-medium text-trato-600 hover:text-trato-700">
            Ingresa aquí
          </Link>
        </p>
      </div>
    </main>
  );
}

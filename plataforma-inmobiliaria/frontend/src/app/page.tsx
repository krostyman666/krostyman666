import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-green-50 p-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Compra y Vende sin Intermediarios
        </h1>

        <p className="text-xl text-gray-600 mb-8">
          La plataforma más transparente, rápida y económica para compraventa de propiedades en Chile
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-2xl font-bold text-blue-600 mb-2">30-50% Más Barato</h3>
            <p className="text-gray-600">Vs comisiones tradicionales de corredores</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-2xl font-bold text-green-600 mb-2">15 Días</h3>
            <p className="text-gray-600">Vs 60 días con corredores tradicionales</p>
          </div>
        </div>

        <div className="flex gap-4 justify-center mb-8">
          <Link
            href="/auth/register?type=seller"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Vender Propiedad
          </Link>

          <Link
            href="/auth/register?type=buyer"
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Buscar Propiedad
          </Link>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700">
          <p className="font-semibold mb-2">🚀 MVP en Desarrollo</p>
          <p>Estamos finalizando la plataforma. Regístrate ahora para ser de los primeros usuarios.</p>
        </div>
      </div>

      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>© 2026 Plataforma Inmobiliaria. Todos los derechos reservados.</p>
      </footer>
    </main>
  );
}

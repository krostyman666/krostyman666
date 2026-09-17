import Link from 'next/link';

export default function Cabecera({ volverA, volverTexto }: { volverA?: string; volverTexto?: string }) {
  return (
    <header className="border-b border-tinta/5 bg-white">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-tinta">
          Trato<span className="text-trato-600">.</span>
        </Link>
        {volverA && (
          <Link href={volverA} className="text-sm font-medium text-tinta-suave hover:text-tinta">
            {volverTexto ?? 'Volver'}
          </Link>
        )}
      </div>
    </header>
  );
}

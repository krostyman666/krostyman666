import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ChatbotWidget } from '@/components/ChatbotWidget';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Trato | Compra y vende tu propiedad directo, sin corredores',
  description:
    'Trato directo entre dueño y comprador. Todos los papeles, escrituras, impuestos y firmas en un solo lugar, por 1% + IVA en vez de la comisión del corredor.',
  keywords: [
    'trato directo',
    'vender casa sin corredor',
    'compraventa propiedad Chile',
    'escritura compraventa',
    'comisión corredor propiedades',
  ],
  openGraph: {
    title: 'Trato | Compra y vende tu propiedad directo',
    description:
      'Todos los papeles, impuestos y firmas de tu compraventa en un solo lugar. Sin comisiones millonarias.',
    locale: 'es_CL',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" className={inter.variable}>
      <body>
        {children}
        <ChatbotWidget />
      </body>
    </html>
  );
}

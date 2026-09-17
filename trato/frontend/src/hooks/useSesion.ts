'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, borrarToken, leerToken } from '@/lib/api';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rut: string;
  telefono: string | null;
  rol: 'vendedor' | 'comprador' | 'asesor' | 'notaria' | 'admin';
  emailVerificado: boolean;
}

type Estado = 'cargando' | 'autenticado' | 'anonimo';

export function useSesion(exigirSesion = true) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [estado, setEstado] = useState<Estado>('cargando');

  useEffect(() => {
    let vigente = true;

    async function cargar() {
      if (!leerToken()) {
        if (!vigente) return;
        setEstado('anonimo');
        if (exigirSesion) router.replace('/ingresar');
        return;
      }

      try {
        const { data } = await api.get('/auth/perfil');
        if (!vigente) return;
        setUsuario(data.usuario);
        setEstado('autenticado');
      } catch {
        if (!vigente) return;
        borrarToken();
        setEstado('anonimo');
        if (exigirSesion) router.replace('/ingresar');
      }
    }

    cargar();
    return () => {
      vigente = false;
    };
  }, [exigirSesion, router]);

  function salir() {
    borrarToken();
    setUsuario(null);
    setEstado('anonimo');
    router.push('/');
  }

  return { usuario, estado, salir };
}

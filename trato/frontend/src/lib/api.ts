import axios, { AxiosError } from 'axios';

const CLAVE_TOKEN = 'trato_token';

export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = leerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function leerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CLAVE_TOKEN);
}

export function guardarToken(token: string): void {
  window.localStorage.setItem(CLAVE_TOKEN, token);
}

export function borrarToken(): void {
  window.localStorage.removeItem(CLAVE_TOKEN);
}

export function mensajeDeError(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (error.code === 'ERR_NETWORK') {
      return 'No pudimos conectar con el servidor. Revisa que la API esté corriendo.';
    }
  }
  return 'Algo salió mal. Intenta de nuevo.';
}

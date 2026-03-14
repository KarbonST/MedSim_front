import type { StaffProfile } from '../types/app';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export function createBasicAuthHeader(login: string, password: string): string {
  return `Basic ${window.btoa(`${login}:${password}`)}`;
}

export async function fetchStaffProfile(authHeader: string): Promise<StaffProfile> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Неверный логин или пароль ведущего.');
    }

    throw new Error('Не удалось выполнить вход. Попробуйте ещё раз.');
  }

  return response.json() as Promise<StaffProfile>;
}

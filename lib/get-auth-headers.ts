'use server';

import { cookies } from 'next/headers';


 
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();

  const raw =
    cookieStore.get('access-token')?.value ||
    cookieStore.get('access_token')?.value ||
    '';

  const token = raw.replace(/\s+/g, '').replace(/^(Bearer|Token)\s*/i, '');
  const sessionToken = cookieStore.get('session-token')?.value || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token && token !== 'undefined' && token !== 'null') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (sessionToken && sessionToken !== 'undefined' && sessionToken !== 'null') {
    headers['X-Session-Token'] = sessionToken;
  }

  return headers;
}
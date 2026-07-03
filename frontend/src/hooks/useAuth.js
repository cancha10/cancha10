import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';

export function useAuth() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('c10_token');
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then(setUsuario)
      .catch(() => localStorage.removeItem('c10_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem('c10_token', data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('c10_token');
    setUsuario(null);
  }, []);

  return { usuario, loading, login, logout };
}

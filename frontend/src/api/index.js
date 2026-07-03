// Cambia esta URL por la de tu backend en Railway cuando lo publiques
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('c10_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem('c10_token');
    window.location.reload();
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => request('/auth/me'),

  cambiarPassword: (password_actual, password_nuevo) =>
    request('/auth/cambiar-password', {
      method: 'POST',
      body: JSON.stringify({ password_actual, password_nuevo }),
    }),

  registrar: (datos) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(datos) }),
};

// ── Sesiones y clases ─────────────────────────────────────────
export const sesionesAPI = {
  delDia: (fecha) => request(`/sesiones?fecha=${fecha}`),
  alumnos: (sesionId) => request(`/sesiones/${sesionId}/alumnos`),
  horario: () => request('/clases'),
  registrarAsistencia: (sesionId, asistencias) =>
    request(`/sesiones/${sesionId}/asistencia`, {
      method: 'POST',
      body: JSON.stringify({ asistencias }),
    }),
  cancelar: (sesionId, notas) =>
    request(`/sesiones/${sesionId}/cancelar`, {
      method: 'PATCH',
      body: JSON.stringify({ notas }),
    }),
};

// ── Alumnos ───────────────────────────────────────────────────
export const alumnosAPI = {
  listar: () => request('/alumnos'),
  obtener: (id) => request(`/alumnos/${id}`),
  actualizar: (id, datos) =>
    request(`/alumnos/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),
  asistencia: (id, mes, anio) =>
    request(`/alumnos/${id}/asistencia?mes=${mes}&anio=${anio}`),
};

// ── Reservaciones ─────────────────────────────────────────────
export const reservacionesAPI = {
  misReservas: () => request('/reservaciones/mis-reservas'),
  crear: (sesion_id) =>
    request('/reservaciones', { method: 'POST', body: JSON.stringify({ sesion_id }) }),
  cancelar: (id) => request(`/reservaciones/${id}`, { method: 'DELETE' }),
};

// ── Pagos ─────────────────────────────────────────────────────
export const pagosAPI = {
  listar: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/pagos${q ? '?' + q : ''}`);
  },
  pendientes: () => request('/pagos/pendientes'),
  misPagos: () => request('/pagos/mis-pagos'),
  registrar: (datos) =>
    request('/pagos', { method: 'POST', body: JSON.stringify(datos) }),
  actualizarEstado: (id, estado, referencia) =>
    request(`/pagos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado, referencia }),
    }),
};

// ── Inscripciones y paquetes ──────────────────────────────────
export const inscripcionesAPI = {
  listar: () => request('/inscripciones'),
  crear: (datos) =>
    request('/inscripciones', { method: 'POST', body: JSON.stringify(datos) }),
  renovar: (id) => request(`/inscripciones/${id}/renovar`, { method: 'PATCH' }),
  paquetes: () => request('/paquetes'),
};

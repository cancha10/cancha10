// ── Cliente API real para Cancha 10 ─────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

function getToken() {
  return localStorage.getItem("c10_token");
}

async function apiCall(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    if (token) {
      localStorage.removeItem("c10_token");
      localStorage.removeItem("c10_usuario");
      window.location.reload();
      return null;
    }
    // Sin token previo (ej. pantallas públicas) — no recargar, solo lanzar error normal
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data;
}

// Para subir archivos (comprobantes) usamos FormData, no JSON
async function apiUpload(endpoint, file, fieldName = "comprobante") {
  const token = getToken();
  const formData = new FormData();
  formData.append(fieldName, file);

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────
const Api = {
  login: (email, password) =>
    apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  inscripcionPublica: (datos) =>
    apiCall("/auth/inscripcion", {
      method: "POST",
      body: JSON.stringify(datos),
    }),

  cambiarPassword: (password_actual, password_nuevo) =>
    apiCall("/auth/cambiar-password", {
      method: "POST",
      body: JSON.stringify({ password_actual, password_nuevo }),
    }),

  resetearPassword: (usuarioId) =>
    apiCall(`/auth/resetear-password/${usuarioId}`, { method: "POST" }),

  me: () => apiCall("/auth/me"),

  // ── Alumnos ─────────────────────────────────────────────────────────
  listarAlumnos: () => apiCall("/alumnos"),
  obtenerAlumno: (id) => apiCall(`/alumnos/${id}`),
  actualizarAlumno: (id, datos) =>
    apiCall(`/alumnos/${id}`, { method: "PUT", body: JSON.stringify(datos) }),
  eliminarAlumno: (id) => apiCall(`/alumnos/${id}`, { method: "DELETE" }),
  restablecerPassword: (id) =>
    apiCall(`/alumnos/${id}/restablecer-password`, { method: "PATCH" }),
  asistenciaAlumno: (id) => apiCall(`/alumnos/${id}/asistencia`),
  // --- Inscripciones ---
  crearInscripcion: (datos) =>
    apiCall("/inscripciones", {
      method: "POST",
      body: JSON.stringify(datos),
    }),

  darDeBajaInscripcion: (id, datos = {}) =>
    apiCall(`/inscripciones/${id}/baja`, {
      method: "PATCH",
      body: JSON.stringify(datos),
    }),
  // ── Ficha técnica ───────────────────────────────────────────────────
  obtenerFicha: (id) => apiCall(`/alumnos/${id}/ficha`),
  actualizarFicha: (id, datos) =>
    apiCall(`/alumnos/${id}/ficha`, {
      method: "PUT",
      body: JSON.stringify(datos),
    }),

  // ── Feedback ────────────────────────────────────────────────────────
  listarFeedback: (id) => apiCall(`/alumnos/${id}/feedback`),
  agregarFeedback: (id, texto) =>
    apiCall(`/alumnos/${id}/feedback`, {
      method: "POST",
      body: JSON.stringify({ texto }),
    }),

  // ── Clases / horarios ───────────────────────────────────────────────
  horario: () => apiCall("/clases"),
  crearClase: (datos) =>
    apiCall("/clases", { method: "POST", body: JSON.stringify(datos) }),
  editarClase: (grupoId, datos) =>
    apiCall(`/clases/${grupoId}`, {
      method: "PUT",
      body: JSON.stringify(datos),
    }),
  eliminarClase: (grupoId) =>
    apiCall(`/clases/${grupoId}`, { method: "DELETE" }),
  sesionesDelDia: (fecha) => apiCall(`/sesiones?fecha=${fecha}`),
  alumnosDeSesion: (sesionId) => apiCall(`/sesiones/${sesionId}/alumnos`),
  registrarAsistencia: (sesionId, asistencias) =>
    apiCall(`/sesiones/${sesionId}/asistencia`, {
      method: "POST",
      body: JSON.stringify({ asistencias }),
    }),
  suspenderSesion: (sesionId, motivo, otroMotivo = "") =>
    apiCall(`/sesiones/${sesionId}/suspender`, {
      method: "POST",
      body: JSON.stringify({
        motivo,
        otro_motivo: otroMotivo,
      }),
    }),
  listarReposicionesPendientes: () => apiCall("/reposiciones/pendientes"),
  revertirReposicion: (reposicionId) =>
    apiCall(`/reposiciones/${reposicionId}/revertir`, {
      method: "POST",
    }),
  usarReposicion: (reposicionId, sesionId) =>
    apiCall(`/reposiciones/${reposicionId}/usar`, {
      method: "POST",
      body: JSON.stringify({
        sesionId,
      }),
    }),
  // ── Reservaciones ───────────────────────────────────────────────────
  misReservas: () => apiCall("/reservaciones/mis-reservas"),
  crearReserva: (sesion_id) =>
    apiCall("/reservaciones", {
      method: "POST",
      body: JSON.stringify({ sesion_id }),
    }),
  cancelarReserva: (id) =>
    apiCall(`/reservaciones/${id}`, { method: "DELETE" }),

  // ── Paquetes ────────────────────────────────────────────────────────
  listarPaquetes: () => apiCall("/paquetes"),
  crearPaquete: (datos) =>
    apiCall("/paquetes", { method: "POST", body: JSON.stringify(datos) }),
  editarPaquete: (id, datos) =>
    apiCall(`/paquetes/${id}`, { method: "PUT", body: JSON.stringify(datos) }),
  eliminarPaquete: (id) => apiCall(`/paquetes/${id}`, { method: "DELETE" }),
  actualizarDiaPago: (inscripcionId, dia_pago) =>
    apiCall(`/inscripciones/${inscripcionId}/dia-pago`, {
      method: "PATCH",
      body: JSON.stringify({ dia_pago }),
    }),

  // ── Pagos ───────────────────────────────────────────────────────────
  listarPagos: () => apiCall("/pagos"),
  pagosPendientes: () => apiCall("/pagos/pendientes"),
  misPagos: () => apiCall("/pagos/mis-pagos"),
  registrarPago: (datos) =>
    apiCall("/pagos", { method: "POST", body: JSON.stringify(datos) }),
  actualizarPago: (id, estado) =>
    apiCall(`/pagos/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    }),
  editarPago: (id, datos) =>
    apiCall(`/pagos/${id}`, {
      method: "PUT",
      body: JSON.stringify(datos),
    }),
  eliminarPago: (id) => apiCall(`/pagos/${id}`, { method: "DELETE" }),
  subirComprobante: (pagoId, file) =>
    apiUpload(`/pagos/${pagoId}/comprobante`, file),

  // ── Gastos y resumen financiero ─────────────────────────────────────
  listarGastos: (mes, anio) =>
    apiCall(`/gastos${mes && anio ? `?mes=${mes}&anio=${anio}` : ""}`),
  crearGasto: (datos) =>
    apiCall("/gastos", { method: "POST", body: JSON.stringify(datos) }),
  eliminarGasto: (id) => apiCall(`/gastos/${id}`, { method: "DELETE" }),
  resumenFinanciero: (mes, anio) =>
    apiCall(
      `/gastos/resumen-financiero${mes && anio ? `?mes=${mes}&anio=${anio}` : ""}`,
    ),
};

export default Api;

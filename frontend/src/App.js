import AlumnoExpediente from "./components/AlumnoExpediente";
import DashboardHeader from "./components/DashboardHeader";
import ResumenCobranza from "./components/ResumenCobranza";
import { useState, useEffect, useCallback } from "react";
import "./index.css";
import Api from "./api";
function fmtFechaCorta(fecha) {
  if (!fecha) return "—";

  const valor = String(fecha).slice(0, 10);
  const [anio, mes, dia] = valor.split("-");

  if (!anio || !mes || !dia) return "—";

  return `${dia}/${mes}/${anio}`;
}
// ── Config ────────────────────────────────────────────────────────────
const API = process.env.REACT_APP_API_URL || "http://localhost:3000/api";
const WHATSAPP_NUM = "5215532226765"; // 52 + 1 + 10 dígitos para link wa.me

// ── Helpers ───────────────────────────────────────────────────────────
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_NAMES = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
const NIVEL_OPTS = ["principiante", "intermedio", "avanzado"];
const TIPO_OPTS = ["niño", "adulto", "particular"];

const fmtH = (h) => {
  if (!h) return "";
  const [hh, mm] = h.split(":");
  const hr = parseInt(hh);
  return `${hr > 12 ? hr - 12 : hr}:${mm} ${hr >= 12 ? "PM" : "AM"}`;
};
const todayISO = () => new Date().toISOString().split("T")[0];
const inits = (n) =>
  n
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
const waLink = (msg) =>
  `https://wa.me/${WHATSAPP_NUM}${msg ? "?text=" + encodeURIComponent(msg) : ""}`;

// ── Horarios base (editables en runtime) ─────────────────────────────
const HORARIOS_INIT = [
  {
    id: "h1",
    grupo: "Niños Principiantes",
    dias: [1, 3],
    hi: "17:00",
    hf: "18:00",
    tipo: "niño",
    nivel: "principiante",
    cap: null,
  },
  {
    id: "h2",
    grupo: "Niños Avanzados",
    dias: [2, 4],
    hi: "17:00",
    hf: "18:00",
    tipo: "niño",
    nivel: "avanzado",
    cap: 6,
  },
  {
    id: "h3",
    grupo: "Mujeres Principiantes",
    dias: [1, 3],
    hi: "18:00",
    hf: "19:00",
    tipo: "adulto",
    nivel: "principiante",
    cap: null,
  },
  {
    id: "h4",
    grupo: "Adultos Intermedios",
    dias: [2, 4],
    hi: "18:00",
    hf: "19:00",
    tipo: "adulto",
    nivel: "intermedio",
    cap: 6,
  },
  {
    id: "h5",
    grupo: "Adultos Intermedios",
    dias: [2, 4],
    hi: "19:00",
    hf: "20:00",
    tipo: "adulto",
    nivel: "intermedio",
    cap: 6,
  },
  {
    id: "h6",
    grupo: "Adultos Avanzados",
    dias: [5],
    hi: "19:00",
    hf: "20:00",
    tipo: "adulto",
    nivel: "avanzado",
    cap: 6,
  },
  {
    id: "h7",
    grupo: "Clase Particular Patoni",
    dias: [2, 4],
    hi: "18:00",
    hf: "19:00",
    tipo: "particular",
    nivel: null,
    cap: 1,
  },
  {
    id: "h8",
    grupo: "Clase Particular Tony",
    dias: [1, 3],
    hi: "19:00",
    hf: "20:00",
    tipo: "particular",
    nivel: null,
    cap: 1,
  },
  {
    id: "h9",
    grupo: "Clase Particular Hanai",
    dias: [3, 5],
    hi: "20:00",
    hf: "21:00",
    tipo: "particular",
    nivel: null,
    cap: 1,
  },
];
let _horarios = [...HORARIOS_INIT];
const getHorarios = () => _horarios;
const setHorariosGlobal = (h) => {
  _horarios = h;
};

// ── Ficha técnica: definición de golpes y cualidades físicas ──────────
const GOLPES_TENIS = [
  { key: "derecha", label: "Derecha (Forehand)" },
  { key: "reves", label: "Revés" },
  { key: "saque", label: "Saque" },
  { key: "volea", label: "Volea" },
  { key: "smash", label: "Smash / Remate" },
  { key: "dejada", label: "Dejada (Drop shot)" },
  { key: "globo", label: "Globo (Lob)" },
  { key: "devolucion", label: "Devolución de saque" },
];
const FISICAS_TENIS = [
  { key: "velocidad", label: "Velocidad" },
  { key: "resistencia", label: "Resistencia" },
  { key: "fuerza", label: "Fuerza" },
  { key: "coordinacion", label: "Coordinación" },
  { key: "flexibilidad", label: "Flexibilidad" },
  { key: "agilidad", label: "Agilidad / Cambios de dirección" },
  { key: "equilibrio", label: "Equilibrio" },
];
const TACTICAS_TENIS = [
  { key: "tactica", label: "Sentido táctico / lectura del juego" },
  { key: "mental", label: "Fortaleza mental" },
  { key: "consistencia", label: "Consistencia" },
];

function fichaVacia() {
  const f = {};
  [...GOLPES_TENIS, ...FISICAS_TENIS, ...TACTICAS_TENIS].forEach(
    (c) => (f[c.key] = 7),
  );
  return f;
}

// ── Datos iniciales de alumnos (con datos extendidos) ─────────────────
const ALUMNOS_INIT = [
  {
    id: "a1",
    n: "Ana Martínez",
    email: "ana.martinez@email.com",
    telefono: "998 111 2222",
    nivel: "principiante",
    tipo: "adulto",
    pkg: "Paquete 2",
    monto: 1600,
    grupo: "Mujeres Principiantes",
    pago: "pagado",
    ficha: { ...fichaVacia() },
    notasGenerales:
      "Buena disposición, mejora constante en la técnica de derecha.",
    asistencias: [
      { fecha: "2026-06-09", estado: "asistio" },
      { fecha: "2026-06-11", estado: "asistio" },
      { fecha: "2026-06-16", estado: "falta" },
    ],
    pagos: [
      {
        periodo: "Junio 2026",
        monto: 1600,
        estado: "pagado",
        fecha: "2026-06-01",
        comprobante: null,
      },
    ],
    feedback: [
      {
        fecha: "2026-06-11",
        autor: "Roberto Estrada",
        texto:
          "Excelente avance en el saque, seguir trabajando el revés a dos manos.",
      },
    ],
  },
  {
    id: "a2",
    n: "Carlos Pérez",
    email: "carlos.perez@email.com",
    telefono: "998 222 3333",
    nivel: "intermedio",
    tipo: "adulto",
    pkg: "Paquete 3",
    monto: 2200,
    grupo: "Adultos Intermedios",
    pago: "pendiente",
    ficha: { ...fichaVacia() },
    notasGenerales:
      "Jugador competitivo, necesita trabajar la paciencia en puntos largos.",
    asistencias: [
      { fecha: "2026-06-09", estado: "asistio" },
      { fecha: "2026-06-11", estado: "asistio" },
    ],
    pagos: [
      {
        periodo: "Mayo 2026",
        monto: 2200,
        estado: "pagado",
        fecha: "2026-05-02",
        comprobante: null,
      },
    ],
    feedback: [],
  },
  {
    id: "a3",
    n: "Sofía Luna",
    email: "sofia.luna@email.com",
    telefono: "998 333 4444",
    nivel: "principiante",
    tipo: "niño",
    pkg: "Paquete 1",
    monto: 900,
    grupo: "Niños Principiantes",
    pago: "pagado",
    ficha: { ...fichaVacia() },
    notasGenerales: "Muy entusiasta, buena coordinación para su edad.",
    asistencias: [
      { fecha: "2026-06-08", estado: "asistio" },
      { fecha: "2026-06-10", estado: "asistio" },
    ],
    pagos: [
      {
        periodo: "Junio 2026",
        monto: 900,
        estado: "pagado",
        fecha: "2026-06-01",
        comprobante: null,
      },
    ],
    feedback: [
      {
        fecha: "2026-06-10",
        autor: "Roberto Estrada",
        texto: "Gran progreso en el control de la pelota.",
      },
    ],
  },
  {
    id: "a4",
    n: "Diego Ríos",
    email: "diego.rios@email.com",
    telefono: "998 444 5555",
    nivel: "avanzado",
    tipo: "adulto",
    pkg: "Paquete 4",
    monto: 3000,
    grupo: "Adultos Avanzados",
    pago: "vencido",
    ficha: { ...fichaVacia() },
    notasGenerales: "Nivel competitivo alto, candidato a torneos locales.",
    asistencias: [{ fecha: "2026-06-12", estado: "asistio" }],
    pagos: [
      {
        periodo: "Mayo 2026",
        monto: 3000,
        estado: "vencido",
        fecha: null,
        comprobante: null,
      },
    ],
    feedback: [],
  },
  {
    id: "a5",
    n: "Valeria Torres",
    email: "valeria.torres@email.com",
    telefono: "998 555 6666",
    nivel: "intermedio",
    tipo: "adulto",
    pkg: "Paquete 2",
    monto: 1600,
    grupo: "Adultos Intermedios",
    pago: "pagado",
    ficha: { ...fichaVacia() },
    notasGenerales: "",
    asistencias: [
      { fecha: "2026-06-09", estado: "asistio" },
      { fecha: "2026-06-11", estado: "asistio" },
    ],
    pagos: [
      {
        periodo: "Junio 2026",
        monto: 1600,
        estado: "pagado",
        fecha: "2026-06-03",
        comprobante: null,
      },
    ],
    feedback: [],
  },
  {
    id: "a6",
    n: "Marco Salas",
    email: "marco.salas@email.com",
    telefono: "998 666 7777",
    nivel: "principiante",
    tipo: "adulto",
    pkg: "Paquete 1",
    monto: 900,
    grupo: "Mujeres Principiantes",
    pago: "pendiente",
    ficha: { ...fichaVacia() },
    notasGenerales: "",
    asistencias: [],
    pagos: [
      {
        periodo: "Junio 2026",
        monto: 900,
        estado: "pendiente",
        fecha: null,
        comprobante: null,
      },
    ],
    feedback: [],
  },
];
let _alumnos = [...ALUMNOS_INIT];
const getAlumnos = () => _alumnos;
const setAlumnosGlobal = (a) => {
  _alumnos = a;
};

// ── Solicitudes de inscripción pendientes (vista admin) ────────────────
let _solicitudes = [];
const getSolicitudes = () => _solicitudes;
const setSolicitudesGlobal = (s) => {
  _solicitudes = s;
};

const PAQUETES_CATALOGO = [
  { label: "Paquete 1 – 1 hr/semana", monto: 900 },
  { label: "Paquete 2 – 2 hrs/semana", monto: 1600 },
  { label: "Paquete 3 – 3 hrs/semana", monto: 2200 },
  { label: "Paquete 4 – 4 hrs/semana", monto: 3000 },
  { label: "Paquete 5 – 5 hrs/semana", monto: 3800 },
  { label: "Individual 1 clase/semana", monto: 750 },
  { label: "Individual 2 clases/semana", monto: 700 },
  { label: "Individual 3+ clases/semana", monto: 650 },
];
const GRUPOS_CATALOGO = [
  "Niños Principiantes",
  "Niños Avanzados",
  "Mujeres Principiantes",
  "Adultos Intermedios",
  "Adultos Avanzados",
  "Clase Particular",
];

// ── MOCK DATA / fetch simulado ─────────────────────────────────────────
async function mockFetch(endpoint) {
  await new Promise((r) => setTimeout(r, 300));
  if (endpoint.includes("/sesiones")) {
    const diaMap = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
    const fecha = endpoint.split("fecha=")[1];
    const diaDB = fecha ? diaMap[new Date(fecha + "T12:00:00").getDay()] : 1;
    return getHorarios()
      .filter((h) => h.dias.includes(diaDB))
      .map((h, i) => ({
        id: "s" + i,
        grupo: h.grupo,
        hi: h.hi,
        hf: h.hf,
        reservas: Math.floor(Math.random() * 4) + 1,
        tipo: h.tipo,
        nivel: h.nivel,
        cap: h.cap,
      }));
  }
  if (endpoint.includes("/alumnos")) return getAlumnos();
  if (endpoint.includes("/pagos/pendientes")) {
    return getAlumnos()
      .filter((a) => a.pago !== "pagado")
      .map((a) => ({
        n: a.n,
        pkg: a.pkg,
        m: a.monto,
        e: a.pago,
        id: a.id,
      }));
  }
  if (endpoint.includes("/reservaciones"))
    return [
      {
        id: "r1",
        grupo: "Adultos Intermedios",
        hi: "18:00",
        hf: "19:00",
        fecha: "2026-06-16",
      },
      {
        id: "r2",
        grupo: "Adultos Intermedios",
        hi: "18:00",
        hf: "19:00",
        fecha: "2026-06-18",
      },
      {
        id: "r3",
        grupo: "Adultos Intermedios",
        hi: "18:00",
        hf: "19:00",
        fecha: "2026-06-23",
      },
    ];
  if (endpoint.includes("/mis-pagos"))
    return [
      {
        m: 2200,
        met: "Transferencia",
        e: "pagado",
        pi: "2026-06-01",
        pkg: "Paquete 3",
      },
      {
        m: 2200,
        met: "Efectivo",
        e: "pagado",
        pi: "2026-05-01",
        pkg: "Paquete 3",
      },
    ];
  return [];
}

const ASIST_DEMO = [
  { id: "aa1", n: "Ana Martínez" },
  { id: "aa2", n: "Carlos Pérez" },
  { id: "aa3", n: "Valeria Torres" },
  { id: "aa4", n: "Diego Ríos" },
  { id: "aa5", n: "Marco Salas" },
];

// ── Toast ─────────────────────────────────────────────────────────────
function Toast({ msg, err }) {
  if (!msg) return null;
  return <div className={`toast ${err ? "err" : ""}`}>{msg}</div>;
}

// ── Botón flotante de WhatsApp ─────────────────────────────────────────
function WhatsAppButton() {
  return (
    <a
      href={waLink("Hola, tengo una pregunta sobre Cancha 10 🎾")}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: "fixed",
        bottom: 86,
        right: "50%",
        transform: "translateX(190px)",
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "#25D366",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
        zIndex: 60,
        textDecoration: "none",
        fontSize: 24,
      }}
      aria-label="Contactar por WhatsApp"
    >
      💬
    </a>
  );
}

// ── DateBar ───────────────────────────────────────────────────────────
function DateBar({ selected, onChange }) {
  const days = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      iso: d.toISOString().split("T")[0],
      dia: DIAS[d.getDay()],
      num: d.getDate(),
    });
  }
  return (
    <div className="date-bar">
      {days.map((d) => (
        <div
          key={d.iso}
          className={`dpill ${selected === d.iso ? "active" : ""}`}
          onClick={() => onChange(d.iso)}
        >
          <span className="dpill-day">{d.dia}</span>
          <span className="dpill-num">{d.num}</span>
        </div>
      ))}
    </div>
  );
}

// ── AsistenciaDrawer ──────────────────────────────────────────────────
function AsistenciaDrawer({ sesion, onClose, showToast }) {
  const [alumnosSesion, setAlumnosSesion] = useState([]);
  const [estados, setEstados] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mostrarReposiciones, setMostrarReposiciones] = useState(false);
  const [reposicionesPendientes, setReposicionesPendientes] = useState([]);
  const [loadingReposiciones, setLoadingReposiciones] = useState(false);
  const [errorReposiciones, setErrorReposiciones] = useState("");

  useEffect(() => {
    Api.alumnosDeSesion(sesion.id)
      .then((data) => {
        setAlumnosSesion(data || []);
        const iniciales = {};
        (data || []).forEach((a) => {
          iniciales[a.alumno_id] = a.asistencia_estado || null;
        });
        setEstados(iniciales);
      })
      .catch((e) => setError(e.message || "No se pudo cargar la lista"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion.id]);
  const cargarReposiciones = async () => {
    setLoadingReposiciones(true);
    setErrorReposiciones("");

    try {
      const data = await Api.listarReposicionesPendientes();
      setReposicionesPendientes(data || []);
      setMostrarReposiciones(true);
    } catch (e) {
      setErrorReposiciones(
        e.message || "No se pudieron cargar las reposiciones",
      );
    } finally {
      setLoadingReposiciones(false);
    }
  };
  const candidatosReposicion = Object.values(
    reposicionesPendientes.reduce((acc, r) => {
      if (!acc[r.alumno_id]) {
        acc[r.alumno_id] = r;
      }
      return acc;
    }, {}),
  );
  const toggle = (id, val) =>
    setEstados((prev) => ({ ...prev, [id]: prev[id] === val ? null : val }));

  const guardar = async () => {
    setSaving(true);
    setError("");
    try {
      const asistencias = Object.entries(estados)
        .filter(([, estado]) => estado)
        .map(([alumno_id, estado]) => ({ alumno_id, estado }));
      await Api.registrarAsistencia(sesion.id, asistencias);
      showToast("Asistencia guardada ✓");
      onClose();
    } catch (e) {
      setError(e.message || "No se pudo guardar la asistencia");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="drawer">
        <div className="drawer-handle" />
        <div className="drawer-title">{sesion.grupo}</div>
        <div className="drawer-sub">
          {fmtH(sesion.hi)} – {fmtH(sesion.hf)}
        </div>
        {/* Reposiciones */}
        <button
          type="button"
          className="btn-save"
          style={{ marginBottom: 12 }}
          onClick={cargarReposiciones}
        >
          + AGREGAR CON REPOSICIÓN
        </button>

        {mostrarReposiciones && (
          <div
            style={{
              marginBottom: 14,
              padding: 10,
              border: "1px solid var(--border)",
              borderRadius: 10,
            }}
          >
            {loadingReposiciones ? (
              <div className="loading">Cargando reposiciones...</div>
            ) : errorReposiciones ? (
              <div className="error-msg">{errorReposiciones}</div>
            ) : candidatosReposicion.length === 0 ? (
              <div className="empty">No hay reposiciones disponibles</div>
            ) : (
              candidatosReposicion.map((r) => (
                <div
                  key={r.alumno_id}
                  className="asist-row"
                  style={{ cursor: "pointer" }}
                  onClick={async () => {
                    try {
                      await Api.usarReposicion(r.reposicion_id, sesion.id);
                      showToast(
                        `${r.nombre} ${r.apellido} agregado como reposición ✓`,
                      );
                      setMostrarReposiciones(false);

                      const data = await Api.alumnosDeSesion(sesion.id);
                      setAlumnosSesion(data || []);
                    } catch (e) {
                      setErrorReposiciones(
                        e.message || "No se pudo utilizar la reposición",
                      );
                    }
                  }}
                >
                  <span className="asist-name">
                    ↪ {r.nombre} {r.apellido}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--gold)",
                      fontWeight: 700,
                    }}
                  >
                    Vence {fmtFechaCorta(r.fecha_vencimiento)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}
        {error && <div className="error-msg">{error}</div>}
        {loading ? (
          <div className="loading">
            <span className="spinner" />
            Cargando alumnos...
          </div>
        ) : alumnosSesion.length === 0 ? (
          <div className="empty">Nadie ha reservado esta sesión todavía</div>
        ) : (
          alumnosSesion.map((a) => (
            <div key={a.alumno_id} className="asist-row">
              <span className="asist-name">
                {a.nombre} {a.apellido}
                {a.asistencia_tipo === "reposicion" && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 10,
                      color: "var(--gold)",
                      fontWeight: 800,
                    }}
                  >
                    REPOSICIÓN
                  </span>
                )}
              </span>

              <div className="asist-btns">
                {a.asistencia_tipo === "reposicion" && a.reposicion_id ? (
                  <button
                    type="button"
                    className="asist-btn"
                    title="Revertir reposición"
                    onClick={async () => {
                      try {
                        await Api.revertirReposicion(a.reposicion_id);

                        showToast(
                          `${a.nombre} ${a.apellido}: reposición devuelta ✓`,
                        );

                        const data = await Api.alumnosDeSesion(sesion.id);
                        setAlumnosSesion(data || []);

                        const pendientes =
                          await Api.listarReposicionesPendientes();

                        setReposicionesPendientes(pendientes || []);
                      } catch (e) {
                        setError(
                          e.message || "No se pudo revertir la reposición",
                        );
                      }
                    }}
                    style={{
                      color: "var(--gold)",
                      borderColor: "var(--gold)",
                    }}
                  >
                    ↩
                  </button>
                ) : (
                  <>
                    <button
                      className={`asist-btn ${
                        estados[a.alumno_id] === "asistio" ? "asistio" : ""
                      }`}
                      onClick={() => toggle(a.alumno_id, "asistio")}
                    >
                      ✓
                    </button>

                    <button
                      className={`asist-btn ${
                        estados[a.alumno_id] === "falta" ? "falta" : ""
                      }`}
                      onClick={() => toggle(a.alumno_id, "falta")}
                    >
                      X
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        <button className="btn-save" onClick={guardar} disabled={saving}>
          {saving ? "Guardando..." : "Guardar asistencia"}
        </button>
      </div>
    </div>
  );
}

// ── Slider de puntuación 5-10 para la ficha técnica ────────────────────
function ScoreSlider({ label, value, onChange }) {
  const color =
    value >= 8.5 ? "var(--ok)" : value >= 7 ? "var(--gold)" : "var(--danger)";
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 5,
        }}
      >
        <span style={{ fontSize: 13, color: "var(--wh)" }}>{label}</span>
        <span
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 16,
            fontWeight: 800,
            color,
          }}
        >
          {value}
        </span>
      </div>
      <input
        type="range"
        min="5"
        max="10"
        step="0.5"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: color }}
      />
    </div>
  );
}

// ── Ficha técnica completa (golpes + físico + táctico) ─────────────────
function FichaTecnica({ alumnoId, nombreAlumno, isAdmin, onGuardar, onClose }) {
  const [ficha, setFicha] = useState(fichaVacia());
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Api.obtenerFicha(alumnoId)
      .then((data) => {
        const f = {};
        [...GOLPES_TENIS, ...FISICAS_TENIS, ...TACTICAS_TENIS].forEach((c) => {
          f[c.key] = data[c.key] != null ? parseFloat(data[c.key]) : 7;
        });
        setFicha(f);
        setNotas(data.notas_generales || "");
      })
      .catch((e) => setError(e.message || "No se pudo cargar la ficha"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumnoId]);

  const set = (key, val) => setFicha((p) => ({ ...p, [key]: val }));

  const promedio = (arr) => {
    const vals = arr.map((c) => ficha[c.key]);
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  const guardar = async () => {
    setSaving(true);
    setError("");
    try {
      await Api.actualizarFicha(alumnoId, { ...ficha, notas_generales: notas });
      onGuardar();
    } catch (e) {
      setError(e.message || "No se pudo guardar la ficha");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="drawer">
          <div className="drawer-handle" />
          <div className="loading">
            <span className="spinner" />
            Cargando ficha...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="drawer" style={{ maxHeight: "92dvh" }}>
        <div className="drawer-handle" />
        <div className="drawer-title">Ficha Técnica</div>
        <div className="drawer-sub">
          {nombreAlumno} · Escala 5 (bajo) – 10 (excelente)
        </div>
        {error && <div className="error-msg">{error}</div>}

        <div className="stats-grid" style={{ marginBottom: 18 }}>
          <div className="stat-box">
            <div className="stat-num gold">{promedio(GOLPES_TENIS)}</div>
            <div className="stat-lbl">Golpes</div>
          </div>
          <div className="stat-box">
            <div className="stat-num gold">{promedio(FISICAS_TENIS)}</div>
            <div className="stat-lbl">Físico</div>
          </div>
        </div>

        <div className="card-label" style={{ marginTop: 4 }}>
          🎾 Golpes básicos
        </div>
        {GOLPES_TENIS.map((c) => (
          <ScoreSlider
            key={c.key}
            label={c.label}
            value={ficha[c.key]}
            onChange={isAdmin ? (v) => set(c.key, v) : () => {}}
          />
        ))}

        <div className="card-label" style={{ marginTop: 18 }}>
          💪 Cualidades físicas
        </div>
        {FISICAS_TENIS.map((c) => (
          <ScoreSlider
            key={c.key}
            label={c.label}
            value={ficha[c.key]}
            onChange={isAdmin ? (v) => set(c.key, v) : () => {}}
          />
        ))}

        <div className="card-label" style={{ marginTop: 18 }}>
          🧠 Táctico / Mental
        </div>
        {TACTICAS_TENIS.map((c) => (
          <ScoreSlider
            key={c.key}
            label={c.label}
            value={ficha[c.key]}
            onChange={isAdmin ? (v) => set(c.key, v) : () => {}}
          />
        ))}

        {isAdmin && (
          <div className="field" style={{ marginTop: 16 }}>
            <label>Notas generales (fortalezas / áreas de oportunidad)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Buen control de derecha, trabajar el saque y la resistencia..."
              rows={4}
              style={{
                width: "100%",
                padding: "11px 13px",
                border: "1px solid #2A2A2A",
                borderRadius: 8,
                fontFamily: "inherit",
                fontSize: 14,
                color: "var(--wh)",
                background: "var(--bk3)",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>
        )}

        {!isAdmin && notas && (
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-label">Notas del coach</div>
            <div style={{ fontSize: 13, color: "var(--wh)", lineHeight: 1.5 }}>
              {notas}
            </div>
          </div>
        )}

        {isAdmin && (
          <button className="btn-save" onClick={guardar} disabled={saving}>
            {saving ? "Guardando..." : "Guardar ficha técnica"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── ViewHorarios ──────────────────────────────────────────────────────
function FormClase({ inicial, onClose, onGuardar }) {
  const [form, setForm] = useState(
    inicial || {
      grupo: "",
      dias: [],
      hi: "17:00",
      hf: "18:00",
      tipo: "adulto",
      nivel: "principiante",
      cap: "",
    },
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleDia = (d) => {
    setForm((p) => ({
      ...p,
      dias: p.dias.includes(d)
        ? p.dias.filter((x) => x !== d)
        : [...p.dias, d].sort(),
    }));
  };

  const guardar = async () => {
    if (!form.grupo.trim()) {
      setError("Nombre del grupo requerido");
      return;
    }
    if (!form.dias.length) {
      setError("Selecciona al menos un día");
      return;
    }
    if (form.hi >= form.hf) {
      setError("La hora de fin debe ser mayor a la de inicio");
      return;
    }
    setGuardando(true);
    setError("");
    const payload = {
      grupo: form.grupo,
      dias: form.dias,
      hi: form.hi,
      hf: form.hf,
      tipo: form.tipo,
      nivel: form.nivel,
      cap: form.cap ? parseInt(form.cap) : null,
    };
    try {
      if (inicial?.grupo_id) {
        await Api.editarClase(inicial.grupo_id, payload);
      } else {
        await Api.crearClase(payload);
      }
      onGuardar();
    } catch (e) {
      setError(e.message || "No se pudo guardar la clase");
    } finally {
      setGuardando(false);
    }
  };

  const selStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #2A2A2A",
    borderRadius: 8,
    fontFamily: "inherit",
    fontSize: 14,
    color: "var(--wh)",
    background: "var(--bk3)",
    outline: "none",
  };

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="drawer" style={{ maxHeight: "92dvh" }}>
        <div className="drawer-handle" />
        <div className="drawer-title">
          {inicial ? "Editar clase" : "Nueva clase"}
        </div>
        <div className="drawer-sub">Configura el horario</div>
        {error && <div className="error-msg">{error}</div>}

        <div className="field">
          <label>Nombre del grupo *</label>
          <input
            placeholder="Ej. Adultos Intermedios"
            value={form.grupo}
            onChange={(e) => set("grupo", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Días *</label>
          <div
            style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}
          >
            {[1, 2, 3, 4, 5, 6].map((d) => (
              <button
                key={d}
                onClick={() => toggleDia(d)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 6,
                  border: "1px solid",
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: form.dias.includes(d) ? "var(--gold)" : "none",
                  borderColor: form.dias.includes(d)
                    ? "var(--gold)"
                    : "#2A2A2A",
                  color: form.dias.includes(d) ? "var(--bk)" : "var(--gr)",
                }}
              >
                {DIAS_NAMES[d]}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <div className="field">
            <label>Hora inicio</label>
            <input
              type="time"
              value={form.hi}
              onChange={(e) => set("hi", e.target.value)}
              style={selStyle}
            />
          </div>
          <div className="field">
            <label>Hora fin</label>
            <input
              type="time"
              value={form.hf}
              onChange={(e) => set("hf", e.target.value)}
              style={selStyle}
            />
          </div>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <div className="field">
            <label>Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => set("tipo", e.target.value)}
              style={selStyle}
            >
              {TIPO_OPTS.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Nivel</label>
            <select
              value={form.nivel || ""}
              onChange={(e) => set("nivel", e.target.value || null)}
              style={selStyle}
            >
              <option value="">—</option>
              {NIVEL_OPTS.map((n) => (
                <option key={n} value={n}>
                  {n.charAt(0).toUpperCase() + n.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Cupo máximo (vacío = sin límite)</label>
          <input
            type="number"
            placeholder="Ej. 6"
            value={form.cap || ""}
            onChange={(e) => set("cap", e.target.value)}
            min="1"
            max="30"
          />
        </div>

        <button className="btn-save" onClick={guardar} disabled={guardando}>
          {guardando
            ? "Guardando..."
            : inicial
              ? "Guardar cambios"
              : "Agregar clase"}
        </button>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            marginTop: 10,
            padding: "11px",
            background: "none",
            border: "1px solid #2A2A2A",
            borderRadius: 8,
            color: "var(--gr)",
            fontFamily: "inherit",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── ViewPaquetes ──────────────────────────────────────────────────────
const TIPOS_COBRO = [
  { value: "mensual", label: "Mensual (clases grupales)" },
  { value: "por_sesion", label: "Por sesión (clases individuales)" },
];

function FormPaquete({ inicial, onClose, onGuardar }) {
  const [form, setForm] = useState(
    inicial || {
      nombre: "",
      tipo: "grupal",
      clases_semana: "",
      precio_mensual: "",
      precio_clase: "",
      precio_cancha: "0",
      descripcion: "",
    },
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const selStyle = {
    width: "100%",
    padding: "11px 13px",
    border: "1px solid #2A2A2A",
    borderRadius: 8,
    fontFamily: "inherit",
    fontSize: 14,
    color: "var(--wh)",
    background: "var(--bk3)",
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      setError("Nombre requerido");
      return;
    }
    if (form.tipo === "grupal" && !form.precio_mensual) {
      setError("Precio mensual requerido");
      return;
    }
    if (form.tipo === "particular" && !form.precio_clase) {
      setError("Precio por clase requerido");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const payload = {
        nombre: form.nombre,
        tipo: form.tipo,
        descripcion: form.descripcion,
        clases_semana: form.clases_semana ? parseInt(form.clases_semana) : null,
        precio_mensual: form.precio_mensual
          ? parseFloat(form.precio_mensual)
          : null,
        precio_clase: form.precio_clase ? parseFloat(form.precio_clase) : null,
        precio_cancha: form.precio_cancha ? parseFloat(form.precio_cancha) : 0,
      };
      if (inicial?.id) {
        await Api.editarPaquete(inicial.id, payload);
      } else {
        await Api.crearPaquete(payload);
      }
      onGuardar();
    } catch (e) {
      setError(e.message || "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="drawer" style={{ maxHeight: "92dvh" }}>
        <div className="drawer-handle" />
        <div className="drawer-title">
          {inicial ? "Editar paquete" : "Nuevo paquete"}
        </div>
        {error && <div className="error-msg">{error}</div>}
        <div className="field">
          <label>Nombre *</label>
          <input
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            placeholder="Ej. Grupal 2 días/semana"
          />
        </div>
        <div className="field">
          <label>Tipo de paquete</label>
          <select
            value={form.tipo}
            onChange={(e) => set("tipo", e.target.value)}
            style={selStyle}
          >
            <option value="grupal">Grupal (cobro mensual)</option>
            <option value="particular">Particular (cobro por sesión)</option>
          </select>
        </div>
        {form.tipo === "grupal" && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <div className="field">
                <label>Clases / semana</label>
                <input
                  type="number"
                  value={form.clases_semana}
                  onChange={(e) => set("clases_semana", e.target.value)}
                  placeholder="Ej. 2"
                />
              </div>
              <div className="field">
                <label>Precio mensual *</label>
                <input
                  type="number"
                  value={form.precio_mensual}
                  onChange={(e) => set("precio_mensual", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </>
        )}
        {form.tipo === "particular" && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <div className="field">
              <label>Precio por clase *</label>
              <input
                type="number"
                value={form.precio_clase}
                onChange={(e) => set("precio_clase", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="field">
              <label>Renta de cancha</label>
              <input
                type="number"
                value={form.precio_cancha}
                onChange={(e) => set("precio_cancha", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        )}
        <div className="field">
          <label>Descripción (opcional)</label>
          <input
            value={form.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
            placeholder="Detalles adicionales"
          />
        </div>
        <button className="btn-save" onClick={guardar} disabled={guardando}>
          {guardando
            ? "Guardando..."
            : inicial
              ? "Guardar cambios"
              : "Crear paquete"}
        </button>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            marginTop: 10,
            padding: "11px",
            background: "none",
            border: "1px solid #2A2A2A",
            borderRadius: 8,
            color: "var(--gr)",
            fontFamily: "inherit",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function ViewPaquetes({ showToast }) {
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);

  const cargar = () => {
    setLoading(true);
    Api.listarPaquetes()
      .then(setPaquetes)
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    cargar();
  }, []);

  const guardar = () => {
    setShowForm(false);
    setEditando(null);
    showToast("Paquete guardado ✓");
    cargar();
  };
  const eliminar = async (id) => {
    try {
      await Api.eliminarPaquete(id);
      showToast("Paquete desactivado");
      cargar();
    } catch (e) {
      showToast(e.message || "Error", true);
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--gold)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Paquetes
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "6px 13px",
            background: "var(--gold)",
            border: "none",
            borderRadius: 7,
            color: "var(--bk)",
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          + Nuevo
        </button>
      </div>
      {loading ? (
        <div className="loading">
          <span className="spinner" />
          Cargando...
        </div>
      ) : (
        paquetes.map((p) => (
          <div
            key={p.id}
            className="card"
            style={{ marginBottom: 8, padding: "12px 14px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Barlow Condensed',sans-serif",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--wh)",
                  }}
                >
                  {p.nombre}
                </div>
                <div style={{ fontSize: 12, color: "var(--gr)", marginTop: 3 }}>
                  {p.tipo === "particular"
                    ? `$${(parseFloat(p.precio_clase || 0) + parseFloat(p.precio_cancha || 0)).toLocaleString()} / sesión`
                    : `$${parseFloat(p.precio_mensual || 0).toLocaleString()} / mes`}
                  {p.clases_semana ? ` · ${p.clases_semana} clases/sem` : ""}
                </div>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 5,
                    padding: "2px 8px",
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    background: p.tipo === "particular" ? "#1A2A1A" : "#1A1A2A",
                    color:
                      p.tipo === "particular" ? "var(--ok)" : "var(--gold)",
                  }}
                >
                  {p.tipo === "particular" ? "Particular" : "Grupal"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setEditando(p)}
                  style={{
                    padding: "5px 9px",
                    borderRadius: 6,
                    border: "1px solid #2A2A2A",
                    background: "none",
                    color: "var(--gr)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => eliminar(p.id)}
                  style={{
                    padding: "5px 9px",
                    borderRadius: 6,
                    border: "1px solid #3A1010",
                    background: "none",
                    color: "var(--danger)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))
      )}
      {showForm && (
        <FormPaquete onClose={() => setShowForm(false)} onGuardar={guardar} />
      )}
      {editando && (
        <FormPaquete
          inicial={editando}
          onClose={() => setEditando(null)}
          onGuardar={guardar}
        />
      )}
    </>
  );
}

function ViewHorarios({ showToast }) {
  const [horarios, setHorarios] = useState([]); // filas crudas del backend
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmarElim, setConfirmarElim] = useState(null);

  const cargar = () => {
    setLoading(true);
    setError("");
    Api.horario()
      .then((data) => setHorarios(data || []))
      .catch((e) => setError(e.message || "No se pudo cargar el horario"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  // Agrupar las filas (una por día) en "clases" por grupo_id, juntando los días
  const grupos = {};
  horarios.forEach((h) => {
    const key = h.grupo_id;
    if (!grupos[key]) {
      grupos[key] = {
        grupo_id: h.grupo_id,
        grupo: h.grupo,
        hi: h.hora_inicio,
        hf: h.hora_fin,
        tipo: h.tipo,
        nivel: h.nivel,
        cap: h.capacidad,
        dias: [],
      };
    }
    grupos[key].dias.push(h.dia_semana);
  });
  const listaClases = Object.values(grupos);

  const agregar = () => {
    setShowForm(false);
    showToast("Clase agregada ✓");
    cargar();
  };

  const editar = () => {
    setEditando(null);
    showToast("Clase actualizada ✓");
    cargar();
  };

  const eliminar = async (grupoId) => {
    try {
      await Api.eliminarClase(grupoId);
      setConfirmarElim(null);
      showToast("Clase eliminada");
      cargar();
    } catch (e) {
      showToast(e.message || "No se pudo eliminar", true);
    }
  };

  const porDia = [1, 2, 3, 4, 5, 6]
    .map((d) => ({
      dia: d,
      clases: listaClases
        .filter((h) => h.dias.includes(d))
        .sort((a, b) => a.hi.localeCompare(b.hi)),
    }))
    .filter((d) => d.clases.length > 0);

  const badgeCls = (tipo, nivel) => {
    if (tipo === "particular") return "badge badge-particular";
    if (nivel === "avanzado") return "badge badge-avanzado";
    if (nivel === "intermedio") return "badge badge-intermedio";
    return "badge badge-principiante";
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 2,
        }}
      >
        <div className="sec-title">Horarios</div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "8px 16px",
            background: "var(--gold)",
            border: "none",
            borderRadius: 8,
            color: "var(--bk)",
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          + Nueva
        </button>
      </div>
      <div className="sec-sub">{listaClases.length} clases programadas</div>
      {error && <div className="error-msg">{error}</div>}

      {loading ? (
        <div className="loading">
          <span className="spinner" />
          Cargando...
        </div>
      ) : (
        <>
          {porDia.map(({ dia, clases }) => (
            <div key={dia} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "var(--gold)",
                  marginBottom: 8,
                  paddingLeft: 2,
                }}
              >
                {DIAS_NAMES[dia]}
              </div>
              {clases.map((h) => (
                <div
                  key={h.grupo_id + "-" + dia}
                  className="session-card"
                  style={{ marginBottom: 8 }}
                >
                  <div className="session-time">{fmtH(h.hi)}</div>
                  <div style={{ flex: 1 }}>
                    <div className="session-name">{h.grupo}</div>
                    <div className="session-meta">
                      {fmtH(h.hi)} – {fmtH(h.hf)}
                      {h.cap ? ` · máx ${h.cap}` : ""}
                    </div>
                    <span className={badgeCls(h.tipo, h.nivel)}>
                      {h.tipo === "particular"
                        ? "Particular"
                        : h.nivel || h.tipo}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => setEditando(h)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 6,
                        border: "1px solid #2A2A2A",
                        background: "none",
                        color: "var(--gr)",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setConfirmarElim(h)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 6,
                        border: "1px solid #3A1010",
                        background: "none",
                        color: "var(--danger)",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {listaClases.length === 0 && (
            <div className="empty">
              <div className="empty-icon">📅</div>No hay clases programadas
            </div>
          )}
        </>
      )}

      {showForm && (
        <FormClase onClose={() => setShowForm(false)} onGuardar={agregar} />
      )}
      {editando && (
        <FormClase
          inicial={editando}
          onClose={() => setEditando(null)}
          onGuardar={editar}
        />
      )}

      {confirmarElim && (
        <div
          className="overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setConfirmarElim(null)
          }
        >
          <div className="drawer">
            <div className="drawer-handle" />
            <div className="drawer-title">Eliminar clase</div>
            <div
              style={{ fontSize: 13, color: "var(--gr)", margin: "8px 0 20px" }}
            >
              ¿Eliminar{" "}
              <strong style={{ color: "var(--wh)" }}>
                {confirmarElim.grupo}
              </strong>
              ?<br />
              Esta acción no se puede deshacer.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setConfirmarElim(null)}
                style={{
                  flex: 1,
                  padding: "11px",
                  background: "none",
                  border: "1px solid #2A2A2A",
                  borderRadius: 8,
                  color: "var(--gr)",
                  fontFamily: "inherit",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminar(confirmarElim.grupo_id)}
                style={{
                  flex: 1,
                  padding: "11px",
                  background: "var(--danger)",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Formulario nuevo alumno (admin) ─────────────────────────────────────
function FormNuevoAlumno({ onClose, onGuardar }) {
  const [form, setForm] = useState({
    n: "",
    apellido: "",
    email: "",
    telefono: "",
    nivel_id: 1,
    tipo_clase: "grupal",
    grupo_id: "",
    paquete_id: null,
    dia_pago: 1,
  });
  const [paquetes, setPaquetes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const selStyle = {
    width: "100%",
    padding: "11px 13px",
    border: "1px solid #2A2A2A",
    borderRadius: 8,
    fontFamily: "inherit",
    fontSize: 14,
    color: "var(--wh)",
    background: "var(--bk3)",
  };

  useEffect(() => {
    Api.listarPaquetes()
      .then(setPaquetes)
      .catch(() => {});
    Api.horario()
      .then((data) => {
        // Agrupar por grupo_id único
        const unicos = {};
        (data || []).forEach((h) => {
          if (!unicos[h.grupo_id]) unicos[h.grupo_id] = h;
        });
        setGrupos(Object.values(unicos));
      })
      .catch(() => {});
  }, []);

  const guardar = async () => {
    if (!form.n.trim() || !form.apellido.trim() || !form.email.trim()) {
      setError("Nombre, apellido y email son requeridos");
      return;
    }
    if (!form.paquete_id) {
      setError("Selecciona un paquete");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const tempPassword = "C10-" + Math.random().toString(36).slice(2, 8);
      await Api.inscripcionPublica({
        nombre: form.n,
        apellido: form.apellido,
        email: form.email,
        password: tempPassword,
        telefono: form.telefono,
        tipo_clase: form.tipo_clase,
        nivel_id: form.nivel_id ? parseInt(form.nivel_id) : null,
        grupo_id: form.grupo_id ? parseInt(form.grupo_id) : null,
        paquete_id: parseInt(form.paquete_id),
        dia_pago: form.dia_pago ? parseInt(form.dia_pago) : null,
      });
      onGuardar();
    } catch (e) {
      setError(e.message || "No se pudo guardar el alumno");
    } finally {
      setGuardando(false);
    }
  };

  const paquetesFiltrados = paquetes.filter((p) => p.tipo === form.tipo_clase);

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="drawer" style={{ maxHeight: "90dvh" }}>
        <div className="drawer-handle" />
        <div className="drawer-title">Nuevo Alumno</div>
        <div className="drawer-sub">Completa los datos del alumno</div>
        {error && <div className="error-msg">{error}</div>}

        <div className="field">
          <label>Nombre(s) *</label>
          <input
            placeholder="Ej. Ana"
            value={form.n}
            onChange={(e) => set("n", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Apellido(s) *</label>
          <input
            placeholder="Ej. Martínez"
            value={form.apellido}
            onChange={(e) => set("apellido", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Email *</label>
          <input
            type="email"
            placeholder="correo@email.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Teléfono</label>
          <input
            placeholder="998 000 0000"
            value={form.telefono}
            onChange={(e) => set("telefono", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Nivel</label>
          <select
            value={form.nivel_id}
            onChange={(e) => set("nivel_id", e.target.value)}
            style={selStyle}
          >
            <option value="1">Principiante</option>
            <option value="2">Intermedio</option>
            <option value="3">Avanzado</option>
          </select>
        </div>
        <div className="field">
          <label>Tipo de clase</label>
          <select
            value={form.tipo_clase}
            onChange={(e) => {
              set("tipo_clase", e.target.value);
              set("paquete_id", null);
            }}
            style={selStyle}
          >
            <option value="grupal">Grupal</option>
            <option value="particular">Particular</option>
          </select>
        </div>
        {form.tipo_clase === "grupal" && (
          <div className="field">
            <label>Grupo / Horario</label>
            <select
              value={form.grupo_id}
              onChange={(e) => set("grupo_id", e.target.value)}
              style={selStyle}
            >
              <option value="">Seleccionar...</option>
              {grupos
                .filter((g) => g.tipo === "grupal")
                .map((g) => (
                  <option key={g.grupo_id} value={g.grupo_id}>
                    {g.grupo}
                  </option>
                ))}
            </select>
          </div>
        )}
        <div className="field">
          <label>Paquete *</label>
          <select
            value={form.paquete_id || ""}
            onChange={(e) => set("paquete_id", e.target.value)}
            style={selStyle}
          >
            <option value="">Seleccionar...</option>
            {paquetesFiltrados.map((p) => {
              const precio =
                p.tipo === "particular"
                  ? parseFloat(p.precio_clase || 0) +
                    parseFloat(p.precio_cancha || 0)
                  : parseFloat(p.precio_mensual || 0);
              return (
                <option key={p.id} value={p.id}>
                  {p.nombre} — ${precio.toLocaleString()}/
                  {p.tipo === "particular" ? "sesión" : "mes"}
                </option>
              );
            })}
          </select>
        </div>

        <div className="field">
          <label>Día de pago (1-31)</label>
          <input
            type="number"
            min="1"
            max="31"
            value={form.dia_pago}
            onChange={(e) => set("dia_pago", parseInt(e.target.value) || 1)}
            placeholder="Ej. 1, 15, 30"
          />
          <div style={{ fontSize: 11, color: "var(--gr)", marginTop: 4 }}>
            El día del mes en que este alumno paga su mensualidad.
          </div>
        </div>

        <button className="btn-save" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar alumno"}
        </button>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            marginTop: 10,
            padding: "11px",
            background: "none",
            border: "1px solid #2A2A2A",
            borderRadius: 8,
            color: "var(--gr)",
            fontFamily: "inherit",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Agregar feedback de coach ───────────────────────────────────────────
function FormFeedback({ onClose, onGuardar, autor }) {
  const [texto, setTexto] = useState("");
  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="drawer">
        <div className="drawer-handle" />
        <div className="drawer-title">Nueva retroalimentación</div>
        <div className="drawer-sub">Visible para el alumno</div>
        <div className="field">
          <label>Comentario</label>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={5}
            placeholder="Ej. Buen progreso en el saque, trabajar la consistencia del revés..."
            style={{
              width: "100%",
              padding: "11px 13px",
              border: "1px solid #2A2A2A",
              borderRadius: 8,
              fontFamily: "inherit",
              fontSize: 14,
              color: "var(--wh)",
              background: "var(--bk3)",
              outline: "none",
              resize: "vertical",
            }}
          />
        </div>
        <button
          className="btn-save"
          onClick={() => {
            if (texto.trim()) onGuardar(texto.trim());
          }}
        >
          Publicar
        </button>
      </div>
    </div>
  );
}

// ── Detalle / eliminar alumno (admin) ───────────────────────────────────
function DetalleAlumno({
  alumno,
  onClose,
  onEliminar,
  onActualizar,
  showToast,
}) {
  return (
    <AlumnoExpediente
      alumno={alumno}
      onClose={onClose}
      onEliminar={onEliminar}
      onActualizar={onActualizar}
      FichaTecnicaComponent={FichaTecnica}
      showToast={showToast}
    />
  );
}
function ViewAlumnos({ showToast }) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState("");

  const cargar = () => {
    setLoading(true);
    setError("");
    Api.listarAlumnos()
      .then((data) => {
        const unicos = new Map();

        (data || []).forEach((a) => {
          const id = a.usuario_id;

          if (!unicos.has(id)) {
            unicos.set(id, {
              id: a.usuario_id,
              n: a.nombre_completo,
              email: a.email,
              telefono: a.telefono,
              nivel: a.nivel,
              tipo: a.tipo,
              pkg: a.paquete_activo,
              monto: parseFloat(a.costo_mensual) || 0,
              tipo_cobro: a.tipo_cobro,

              // Guardamos todos los grupos del alumno
              grupos: a.grupo ? [a.grupo] : [],

              // Dejamos una inscripción como referencia para la lista.
              // El expediente seguirá cargando todas las inscripciones.
              inscripcion_id: a.inscripcion_id,

              fecha_vencimiento: a.fecha_vencimiento,
              estado_pago: a.estado_pago,
              dias_estado: a.dias_estado,
              dia_pago: a.dia_pago,

              pago:
                a.ultimo_pago_estado === "sin_pago"
                  ? "pendiente"
                  : a.ultimo_pago_estado,
            });
          } else {
            const alumno = unicos.get(id);

            if (a.grupo && !alumno.grupos.includes(a.grupo)) {
              alumno.grupos.push(a.grupo);
            }
          }
        });

        const normalizado = Array.from(unicos.values()).map((a) => ({
          ...a,
          grupo: a.grupos.length > 0 ? a.grupos.join(" / ") : "Sin grupo",
        }));
        setAlumnos(normalizado);
      })
      .catch((e) =>
        setError(e.message || "No se pudo cargar la lista de alumnos"),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, []);
  const estadisticas = {
    total: alumnos.length,
    alCorriente: alumnos.filter((a) => a.estado_pago === "al_corriente").length,
    vencePronto: alumnos.filter((a) => a.estado_pago === "vence_pronto").length,
    atrasados: alumnos.filter((a) => a.estado_pago === "atrasado").length,
    sinPago: alumnos.filter((a) => a.estado_pago === "sin_pago").length,
  };
  const prioridadEstado = {
    atrasado: 4,
    vence_pronto: 3,
    sin_pago: 2,
    al_corriente: 1,
  };

  const alumnosUnicos = Object.values(
    alumnos.reduce((acumulado, alumno) => {
      const clave = alumno.usuario_id || alumno.id;

      if (!acumulado[clave]) {
        acumulado[clave] = {
          ...alumno,
          grupos: [],
        };
      }

      const grupoActual =
        alumno.grupo && alumno.grupo !== "Sin grupo" ? alumno.grupo : null;

      if (grupoActual && !acumulado[clave].grupos.includes(grupoActual)) {
        acumulado[clave].grupos.push(grupoActual);
      }

      const estadoGuardado = acumulado[clave].estado_pago || "al_corriente";

      const estadoNuevo = alumno.estado_pago || "al_corriente";

      if (
        (prioridadEstado[estadoNuevo] || 0) >
        (prioridadEstado[estadoGuardado] || 0)
      ) {
        acumulado[clave] = {
          ...acumulado[clave],
          estado_pago: alumno.estado_pago,
          dias_estado: alumno.dias_estado,
          fecha_vencimiento: alumno.fecha_vencimiento,
          monto: alumno.monto,
        };
      }

      return acumulado;
    }, {}),
  );
  const filtrados = alumnosUnicos.filter(
    (a) =>
      (!busqueda || a.n.toLowerCase().includes(busqueda.toLowerCase())) &&
      (filtro === "todos" || a.estado_pago === filtro),
  );

  const agregarAlumno = () => {
    setShowForm(false);
    showToast("Alumno agregado ✓");
    cargar();
  };

  const eliminarAlumno = async (id) => {
    try {
      await Api.eliminarAlumno(id);
      setDetalle(null);
      showToast("Alumno eliminado");
      cargar();
    } catch (e) {
      showToast(e.message || "No se pudo eliminar", true);
    }
  };

  const actualizarAlumno = () => {
    showToast("Cambios guardados ✓");
    cargar();
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 2,
        }}
      >
        <div className="sec-title">Alumnos</div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "8px 16px",
            background: "var(--gold)",
            border: "none",
            borderRadius: 8,
            color: "var(--bk)",
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          + Nuevo
        </button>
      </div>
      <div className="sec-sub">{alumnosUnicos.length} alumnos activos</div>
      {error && <div className="error-msg">{error}</div>}
      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          placeholder="Buscar alumno..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>
      <DashboardHeader />
      <ResumenCobranza estadisticas={estadisticas} onFiltro={setFiltro} />

      <div className="filter-row">
        {["todos", "al_corriente", "vence_pronto", "atrasado", "sin_pago"].map(
          (f) => (
            <button
              key={f}
              className={`fpill ${filtro === f ? "active" : ""}`}
              onClick={() => setFiltro(f)}
            >
              {f === "todos" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ),
        )}
      </div>
      {loading ? (
        <div className="loading">
          <span className="spinner" />
          Cargando...
        </div>
      ) : (
        <div className="card">
          {filtrados.length === 0 ? (
            <div className="empty">Sin resultados</div>
          ) : (
            filtrados.map((a) => (
              <div
                key={a.id}
                className="alumno-row"
                onClick={() => setDetalle(a)}
                style={{ cursor: "pointer" }}
              >
                <div className="avatar">{inits(a.n)}</div>
                <div style={{ flex: 1 }}>
                  <div className="alumno-name">{a.n}</div>
                </div>
                <div className="text-right">
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 7px",
                      borderRadius: 7,
                      border: `1px solid ${
                        a.estado_pago === "al_corriente"
                          ? "var(--ok)"
                          : a.estado_pago === "vence_pronto"
                            ? "var(--gold)"
                            : a.estado_pago === "atrasado"
                              ? "var(--danger)"
                              : "var(--gr)"
                      }`,
                      color:
                        a.estado_pago === "al_corriente"
                          ? "var(--ok)"
                          : a.estado_pago === "vence_pronto"
                            ? "var(--gold)"
                            : a.estado_pago === "atrasado"
                              ? "var(--danger)"
                              : "var(--gr)",
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      marginBottom: 5,
                    }}
                  >
                    {a.estado_pago === "al_corriente"
                      ? "🟢 Al corriente"
                      : a.estado_pago === "vence_pronto"
                        ? a.dias_estado === 0
                          ? "🟡 Vence hoy"
                          : `🟡 Vence en ${a.dias_estado} días`
                        : a.estado_pago === "atrasado"
                          ? `🔴 ${a.dias_estado} días de atraso`
                          : a.estado_pago === "sin_inscripcion"
                            ? "⚪ Sin inscripción"
                            : "⚪ Sin pago"}
                  </div>

                  <div className="alumno-monto">
                    ${(a.monto || 0).toLocaleString()}
                  </div>

                  {a.fecha_vencimiento && (
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--gr)",
                        marginTop: 2,
                      }}
                    >
                      Vence: {fmtFechaCorta(a.fecha_vencimiento)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {showForm && (
        <FormNuevoAlumno
          onClose={() => setShowForm(false)}
          onGuardar={agregarAlumno}
        />
      )}
      {detalle && (
        <DetalleAlumno
          alumno={detalle}
          onClose={() => setDetalle(null)}
          onEliminar={eliminarAlumno}
          onActualizar={actualizarAlumno}
          showToast={showToast}
        />
      )}
    </>
  );
}

// ── ViewPagos (admin) ────────────────────────────────────────────────
// ── Formulario nuevo gasto ───────────────────────────────────────────
const CATEGORIAS_GASTO = [
  { value: "renta", label: "Renta" },
  { value: "nomina", label: "Nómina" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "equipo", label: "Equipo" },
  { value: "marketing", label: "Marketing" },
  { value: "servicios", label: "Servicios (luz, agua, internet)" },
  { value: "otro", label: "Otro" },
];

function FormGasto({ onClose, onGuardar }) {
  const [form, setForm] = useState({
    concepto: "",
    categoria: "otro",
    monto: "",
    fecha: todayISO(),
    notas: "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const selStyle = {
    width: "100%",
    padding: "11px 13px",
    border: "1px solid #2A2A2A",
    borderRadius: 8,
    fontFamily: "inherit",
    fontSize: 14,
    color: "var(--wh)",
    background: "var(--bk3)",
  };

  const guardar = async () => {
    if (!form.concepto.trim() || !form.monto) {
      setError("Concepto y monto son requeridos");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await Api.crearGasto({ ...form, monto: parseFloat(form.monto) });
      onGuardar();
    } catch (e) {
      setError(e.message || "No se pudo guardar el gasto");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="drawer">
        <div className="drawer-handle" />
        <div className="drawer-title">Nuevo gasto</div>
        <div className="drawer-sub">Registra un gasto de la academia</div>
        {error && <div className="error-msg">{error}</div>}

        <div className="field">
          <label>Concepto *</label>
          <input
            placeholder="Ej. Renta de cancha junio"
            value={form.concepto}
            onChange={(e) => set("concepto", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Categoría</label>
          <select
            value={form.categoria}
            onChange={(e) => set("categoria", e.target.value)}
            style={selStyle}
          >
            {CATEGORIAS_GASTO.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Monto *</label>
          <input
            type="number"
            placeholder="0.00"
            value={form.monto}
            onChange={(e) => set("monto", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Fecha</label>
          <input
            type="date"
            value={form.fecha}
            onChange={(e) => set("fecha", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Notas (opcional)</label>
          <input
            placeholder="Detalles adicionales"
            value={form.notas}
            onChange={(e) => set("notas", e.target.value)}
          />
        </div>

        <button className="btn-save" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar gasto"}
        </button>
      </div>
    </div>
  );
}

function ViewPagos({ showToast }) {
  const [pagos, setPagos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("cobranza"); // 'cobranza' | 'gastos'
  const [showGasto, setShowGasto] = useState(false);

  const cargar = () => {
    setLoading(true);
    setError("");
    Promise.all([
      Api.listarPagos(),
      Api.listarGastos(),
      Api.resumenFinanciero(),
    ])
      .then(([dataPagos, dataGastos, dataResumen]) => {
        setPagos(dataPagos?.pagos || []);
        setGastos(dataGastos?.gastos || []);
        setResumen(dataResumen);
      })
      .catch((e) => setError(e.message || "No se pudieron cargar los datos"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const pendientes = pagos.filter((p) => p.estado !== "pagado");
  const vencidos = pendientes.filter((p) => p.estado === "vencido").length;
  const alCorriente = pagos.filter((p) => p.estado === "pagado").length;

  const cobrar = async (pago) => {
    try {
      await Api.actualizarPago(pago.id, "pagado");
      showToast("Pago registrado ✓");
      cargar();
    } catch (e) {
      showToast(e.message || "No se pudo registrar el pago", true);
    }
  };

  const agregarGasto = () => {
    setShowGasto(false);
    showToast("Gasto registrado ✓");
    cargar();
  };

  const eliminarGasto = async (id) => {
    try {
      await Api.eliminarGasto(id);
      showToast("Gasto eliminado");
      cargar();
    } catch (e) {
      showToast(e.message || "No se pudo eliminar", true);
    }
  };

  return (
    <>
      <div className="sec-title">Finanzas</div>
      <div className="sec-sub">Cobranza y gastos de la academia</div>
      {error && <div className="error-msg">{error}</div>}

      {resumen && (
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-num ok">
              ${resumen.ingresos.toLocaleString()}
            </div>
            <div className="stat-lbl">Cobrado este mes</div>
          </div>
          <div className="stat-box">
            <div className="stat-num gold">
              ${resumen.por_cobrar.toLocaleString()}
            </div>
            <div className="stat-lbl">Por cobrar</div>
          </div>
          <div className="stat-box">
            <div className="stat-num danger">
              ${resumen.gastos.toLocaleString()}
            </div>
            <div className="stat-lbl">Gastos del mes</div>
          </div>
          <div className="stat-box">
            <div
              className={`stat-num ${resumen.balance >= 0 ? "ok" : "danger"}`}
            >
              ${resumen.balance.toLocaleString()}
            </div>
            <div className="stat-lbl">Balance</div>
          </div>
        </div>
      )}

      <div
        className="toggle-row"
        style={{ display: "flex", gap: 8, marginBottom: 14 }}
      >
        <button
          onClick={() => setTab("cobranza")}
          style={{
            flex: 1,
            padding: "9px",
            borderRadius: 8,
            border: "1px solid #2A2A2A",
            background: tab === "cobranza" ? "var(--gold)" : "var(--bk2)",
            color: tab === "cobranza" ? "var(--bk)" : "var(--gr)",
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          Cobranza
        </button>
        <button
          onClick={() => setTab("gastos")}
          style={{
            flex: 1,
            padding: "9px",
            borderRadius: 8,
            border: "1px solid #2A2A2A",
            background: tab === "gastos" ? "var(--gold)" : "var(--bk2)",
            color: tab === "gastos" ? "var(--bk)" : "var(--gr)",
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          Gastos
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <span className="spinner" />
          Cargando...
        </div>
      ) : tab === "cobranza" ? (
        <div className="card">
          <div className="card-label">
            Por cobrar ({vencidos} vencidos · {alCorriente} al corriente)
          </div>
          {pendientes.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">✅</div>Todos al corriente
            </div>
          ) : (
            pendientes.map((p) => (
              <div key={p.id} className="pago-row">
                <div>
                  <div className="pago-nombre">{p.alumno_nombre}</div>
                  <div className="pago-paquete">{p.paquete}</div>
                  <span
                    className={`pago-tag tag-${p.estado}`}
                    style={{ display: "inline-block", marginTop: 6 }}
                  >
                    {p.estado}
                  </span>
                </div>
                <div className="text-right">
                  <div className="pago-monto">
                    ${parseFloat(p.monto).toLocaleString()}
                  </div>
                  <button className="btn-cobrar" onClick={() => cobrar(p)}>
                    ✓ Cobrado
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 10,
            }}
          >
            <button
              onClick={() => setShowGasto(true)}
              style={{
                padding: "8px 16px",
                background: "var(--gold)",
                border: "none",
                borderRadius: 8,
                color: "var(--bk)",
                fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              + Nuevo gasto
            </button>
          </div>
          <div className="card">
            <div className="card-label">Gastos del mes</div>
            {gastos.length === 0 ? (
              <div className="empty">Sin gastos registrados</div>
            ) : (
              gastos.map((g) => (
                <div key={g.id} className="pago-row">
                  <div>
                    <div className="pago-nombre">{g.concepto}</div>
                    <div className="pago-paquete">
                      {CATEGORIAS_GASTO.find((c) => c.value === g.categoria)
                        ?.label || g.categoria}{" "}
                      · {fmtFechaCorta(g.fecha)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="pago-monto"
                      style={{ color: "var(--danger)" }}
                    >
                      -${parseFloat(g.monto).toLocaleString()}
                    </div>
                    <button
                      onClick={() => eliminarGasto(g.id)}
                      style={{
                        marginTop: 6,
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: "1px solid #3A1010",
                        background: "none",
                        color: "var(--danger)",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {showGasto && (
        <FormGasto
          onClose={() => setShowGasto(false)}
          onGuardar={agregarGasto}
        />
      )}
    </>
  );
}

// ── Formulario de auto-inscripción (público, antes de login) ──────────
function FormInscripcion({ onClose, onInscrito }) {
  const [form, setForm] = useState({
    n: "",
    apellido: "",
    email: "",
    telefono: "",
    tipo_clase: "grupal",
    nivel_id: 1,
    grupo_id: "",
    paquete_id: null,
    monto: 0,
    password: "",
  });
  const [paso, setPaso] = useState(1);
  const [paquetes, setPaquetes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const selStyle = {
    width: "100%",
    padding: "11px 13px",
    border: "1px solid #2A2A2A",
    borderRadius: 8,
    fontFamily: "inherit",
    fontSize: 14,
    color: "var(--wh)",
    background: "var(--bk3)",
  };

  useEffect(() => {
    Api.listarPaquetes()
      .then(setPaquetes)
      .catch(() => {});
    Api.horario()
      .then((data) => {
        const unicos = {};
        (data || []).forEach((h) => {
          if (!unicos[h.grupo_id]) unicos[h.grupo_id] = h;
        });
        setGrupos(Object.values(unicos));
      })
      .catch(() => {});
  }, []);

  const siguiente = () => {
    if (paso === 1) {
      if (
        !form.n.trim() ||
        !form.apellido.trim() ||
        !form.email.trim() ||
        !form.password
      ) {
        setError("Completa nombre, apellido, email y contraseña");
        return;
      }
      if (form.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      setError("");
      setPaso(2);
    }
  };

  const confirmar = async () => {
    if (!form.paquete_id) {
      setError("Selecciona un paquete");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      const data = await Api.inscripcionPublica({
        nombre: form.n,
        apellido: form.apellido,
        email: form.email,
        password: form.password,
        telefono: form.telefono,
        tipo_clase: form.tipo_clase,
        nivel_id: form.nivel_id ? parseInt(form.nivel_id) : null,
        grupo_id: form.grupo_id ? parseInt(form.grupo_id) : null,
        paquete_id: parseInt(form.paquete_id),
      });
      onInscrito(data);
    } catch (e) {
      setError(e.message || "Error al inscribirte, intenta de nuevo");
    } finally {
      setEnviando(false);
    }
  };

  const paquetesFiltrados = paquetes.filter((p) => p.tipo === form.tipo_clase);

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="drawer" style={{ maxHeight: "92dvh" }}>
        <div className="drawer-handle" />
        <div className="drawer-title">Inscripción</div>
        <div className="drawer-sub">Paso {paso} de 2</div>
        {error && <div className="error-msg">{error}</div>}

        {paso === 1 && (
          <>
            <div className="field">
              <label>Nombre(s) *</label>
              <input
                value={form.n}
                onChange={(e) => set("n", e.target.value)}
                placeholder="Tu nombre"
              />
            </div>
            <div className="field">
              <label>Apellido(s) *</label>
              <input
                value={form.apellido}
                onChange={(e) => set("apellido", e.target.value)}
                placeholder="Tu apellido"
              />
            </div>
            <div className="field">
              <label>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="tu@email.com"
              />
            </div>
            <div className="field">
              <label>Teléfono</label>
              <input
                value={form.telefono}
                onChange={(e) => set("telefono", e.target.value)}
                placeholder="998 000 0000"
              />
            </div>
            <div className="field">
              <label>Crea tu contraseña *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <button className="btn-save" onClick={siguiente}>
              Siguiente
            </button>
          </>
        )}

        {paso === 2 && (
          <>
            <div className="field">
              <label>Nivel</label>
              <select
                value={form.nivel_id}
                onChange={(e) => set("nivel_id", e.target.value)}
                style={selStyle}
              >
                <option value="1">Principiante</option>
                <option value="2">Intermedio</option>
                <option value="3">Avanzado</option>
              </select>
            </div>
            <div className="field">
              <label>Tipo de clase</label>
              <select
                value={form.tipo_clase}
                onChange={(e) => {
                  set("tipo_clase", e.target.value);
                  set("paquete_id", null);
                  set("monto", 0);
                }}
                style={selStyle}
              >
                <option value="grupal">Grupal</option>
                <option value="particular">Particular</option>
              </select>
            </div>
            {form.tipo_clase === "grupal" && (
              <div className="field">
                <label>Grupo / Horario</label>
                <select
                  value={form.grupo_id}
                  onChange={(e) => set("grupo_id", e.target.value)}
                  style={selStyle}
                >
                  <option value="">Seleccionar...</option>
                  {grupos
                    .filter((g) => g.tipo === "grupal")
                    .map((g) => (
                      <option key={g.grupo_id} value={g.grupo_id}>
                        {g.grupo}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div className="field">
              <label>Paquete *</label>
              <select
                value={form.paquete_id || ""}
                onChange={(e) => {
                  const p = paquetesFiltrados.find(
                    (p) => String(p.id) === e.target.value,
                  );
                  const precio = p
                    ? p.tipo === "particular"
                      ? parseFloat(p.precio_clase || 0) +
                        parseFloat(p.precio_cancha || 0)
                      : parseFloat(p.precio_mensual || 0)
                    : 0;
                  set("paquete_id", p?.id);
                  set("monto", precio);
                }}
                style={selStyle}
              >
                <option value="">Seleccionar...</option>
                {paquetesFiltrados.map((p) => {
                  const precio =
                    p.tipo === "particular"
                      ? parseFloat(p.precio_clase || 0) +
                        parseFloat(p.precio_cancha || 0)
                      : parseFloat(p.precio_mensual || 0);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — ${precio.toLocaleString()}/
                      {p.tipo === "particular" ? "sesión" : "mes"}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: "var(--gr)" }}>
                Total a pagar
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontSize: 26,
                  fontWeight: 800,
                  color: "var(--gold)",
                }}
              >
                ${form.monto.toLocaleString()}
                <span
                  style={{ fontSize: 13, color: "var(--gr)", fontWeight: 500 }}
                >
                  {" "}
                  /{form.tipo_clase === "particular" ? "sesión" : "mes"}
                </span>
              </div>
            </div>
            <button
              className="btn-save"
              onClick={confirmar}
              disabled={enviando}
            >
              {enviando ? "Inscribiendo..." : "Confirmar inscripción"}
            </button>
            <button
              onClick={() => setPaso(1)}
              style={{
                width: "100%",
                marginTop: 10,
                padding: "11px",
                background: "none",
                border: "1px solid #2A2A2A",
                borderRadius: 8,
                color: "var(--gr)",
                fontFamily: "inherit",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Atrás
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Subir comprobante de pago (alumno) ─────────────────────────────────
function FormComprobante({ pagoId, onClose, onGuardar }) {
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setArchivo(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const enviar = async () => {
    if (!archivo) {
      setError("Selecciona un archivo");
      return;
    }
    if (!pagoId) {
      setError("No hay un pago pendiente para adjuntar");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      await Api.subirComprobante(pagoId, archivo);
      onGuardar();
    } catch (e) {
      setError(e.message || "No se pudo subir el comprobante");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="drawer">
        <div className="drawer-handle" />
        <div className="drawer-title">Subir comprobante</div>
        <div className="drawer-sub">Foto o PDF de tu pago</div>
        {error && <div className="error-msg">{error}</div>}

        <label
          style={{
            display: "block",
            border: "2px dashed #2A2A2A",
            borderRadius: 10,
            padding: 24,
            textAlign: "center",
            cursor: "pointer",
            marginBottom: 14,
          }}
        >
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFile}
            style={{ display: "none" }}
          />
          {preview ? (
            <img
              src={preview}
              alt="preview"
              style={{ maxWidth: "100%", maxHeight: 160, borderRadius: 8 }}
            />
          ) : archivo ? (
            <div style={{ color: "var(--gold)", fontSize: 14 }}>
              📄 {archivo.name}
            </div>
          ) : (
            <div style={{ color: "var(--gr)", fontSize: 13 }}>
              📎 Toca para elegir foto o PDF
            </div>
          )}
        </label>

        <button className="btn-save" onClick={enviar} disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar comprobante"}
        </button>
      </div>
    </div>
  );
}

// ── ViewMiEspacio (alumno) ──────────────────────────────────────────────
function ViewMiEspacio({ usuario, showToast }) {
  const [reservas, setReservas] = useState([]);
  const [misPagos, setMisPagos] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showComprobante, setShowComprobante] = useState(false);
  const [showFicha, setShowFicha] = useState(false);
  const [error, setError] = useState("");

  const cargarTodo = () => {
    setLoading(true);
    setError("");
    Promise.all([
      Api.me(),
      Api.misReservas().catch(() => []),
      Api.misPagos().catch(() => []),
    ])
      .then(([me, misReservas, pagosRes]) => {
        setPerfil(me);
        setReservas(misReservas || []);
        setMisPagos(pagosRes || []);
        if (me?.alumno_id) {
          Api.listarFeedback(usuario.id)
            .then(setFeedback)
            .catch(() => {});
        }
      })
      .catch((e) => setError(e.message || "No se pudo cargar tu información"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarTodo();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelarReserva = async (id) => {
    try {
      await Api.cancelarReserva(id);
      showToast("Reserva cancelada");
      cargarTodo();
    } catch (e) {
      showToast(e.message || "No se pudo cancelar", true);
    }
  };

  // Pago pendiente más reciente, para adjuntar comprobante
  const pagoPendiente = misPagos.find((p) => p.estado === "pendiente");

  const subirComprobante = () => {
    setShowComprobante(false);
    showToast("Comprobante enviado ✓");
    cargarTodo();
  };

  if (loading) {
    return (
      <div className="loading">
        <span className="spinner" />
        Cargando tu información...
      </div>
    );
  }

  if (error) {
    return <div className="error-msg">{error}</div>;
  }

  return (
    <>
      <div className="perfil-hero">
        <div className="perfil-nombre">
          {usuario.nombre} {usuario.apellido}
        </div>
        <div className="perfil-nivel">
          Nivel {perfil?.nivel || "—"} · Academia Cancha 10
        </div>
        <div className="perfil-divider" />
        <div className="perfil-pkg-label">
          {misPagos[0]?.paquete || "Sin paquete activo"}
        </div>
        <div className="perfil-precio">
          ${misPagos[0] ? parseFloat(misPagos[0].monto).toLocaleString() : "0"}{" "}
          <span>/ mes</span>
        </div>
      </div>

      <button
        onClick={() => setShowFicha(true)}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: 10,
          background: "var(--bk2)",
          border: "1px solid #2A2A2A",
          borderRadius: 8,
          color: "var(--gold)",
          fontFamily: "'Barlow Condensed',sans-serif",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        🎾 Mi ficha técnica
      </button>

      <div className="card">
        <div className="card-label">Mis próximas clases</div>
        {reservas.length === 0 ? (
          <div className="empty">No tienes clases reservadas</div>
        ) : (
          reservas.map((r) => {
            const d = new Date(r.fecha + "T12:00:00");
            return (
              <div key={r.id} className="reserva-row">
                <div className="reserva-fecha">
                  <div className="res-dia">{DIAS[d.getDay()]}</div>
                  <div className="res-num">{d.getDate()}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="reserva-grupo">{r.grupo}</div>
                  <div className="reserva-hora">
                    {fmtH(r.hora_inicio)} – {fmtH(r.hora_fin)}
                  </div>
                </div>
                <button
                  className="btn-cancelar"
                  onClick={() => cancelarReserva(r.id)}
                >
                  Cancelar
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div className="card-label" style={{ marginBottom: 0 }}>
            Mis pagos
          </div>
          {pagoPendiente && (
            <button
              onClick={() => setShowComprobante(true)}
              style={{
                padding: "5px 11px",
                background: "var(--gold)",
                border: "none",
                borderRadius: 6,
                color: "var(--bk)",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📎 Subir comprobante
            </button>
          )}
        </div>
        {misPagos.length === 0 ? (
          <div className="empty" style={{ padding: "12px 0" }}>
            Sin pagos registrados
          </div>
        ) : (
          misPagos.map((p, i) => (
            <div key={i} className="pago-row">
              <div>
                <div className="pago-nombre" style={{ fontSize: 14 }}>
                  {fmtFechaCorta(p.periodo_inicio)}
                </div>
                <div style={{ fontSize: 11, color: "var(--gr)" }}>
                  {p.metodo_pago || "Pendiente de método"}
                </div>
              </div>
              <div className="text-right">
                <div className="pago-monto">
                  ${parseFloat(p.monto).toLocaleString()}
                </div>
                <span
                  className={`pago-tag tag-${p.estado}`}
                  style={{ display: "inline-block", marginTop: 6 }}
                >
                  {p.estado}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="card-label">Comentarios del coach</div>
        {feedback.length === 0 ? (
          <div className="empty" style={{ padding: "12px 0" }}>
            Aún no hay comentarios
          </div>
        ) : (
          feedback.map((f, i) => (
            <div
              key={f.id || i}
              style={{
                marginBottom: 10,
                paddingBottom: 10,
                borderBottom:
                  i < feedback.length - 1 ? "1px solid #1A1A1A" : "none",
              }}
            >
              <div
                style={{ fontSize: 13, color: "var(--wh)", lineHeight: 1.5 }}
              >
                {f.texto}
              </div>
              <div style={{ fontSize: 11, color: "var(--gr)", marginTop: 4 }}>
                {f.autor} · {fmtFechaCorta((f.created_at || "").split("T")[0])}
              </div>
            </div>
          ))
        )}
      </div>

      {showComprobante && (
        <FormComprobante
          pagoId={pagoPendiente?.id}
          onClose={() => setShowComprobante(false)}
          onGuardar={subirComprobante}
        />
      )}
      {showFicha && (
        <FichaTecnica
          alumnoId={usuario.id}
          nombreAlumno={usuario.nombre}
          isAdmin={false}
          onGuardar={() => {}}
          onClose={() => setShowFicha(false)}
        />
      )}
    </>
  );
}

// ── ViewHoy ───────────────────────────────────────────────────────────
function ViewHoy({ isAdmin, showToast }) {
  const [fecha, setFecha] = useState(todayISO());
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawer, setDrawer] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Api.sesionesDelDia(fecha)
      .then((data) => {
        const normalizado = (data || []).map((s) => ({
          id: s.sesion_id || s.id,
          grupo: s.grupo,
          hi: s.hora_inicio || s.hi,
          hf: s.hora_fin || s.hf,
          reservas: parseInt(s.reservas) || 0,
          cap: s.capacidad ?? s.cap,
          tipo: s.tipo,
          nivel: s.nivel,
        }));
        setSesiones(normalizado);
      })
      .catch((e) => setError(e.message || "No se pudo cargar el horario"))
      .finally(() => setLoading(false));
  }, [fecha]);

  const badgeClass = (tipo, nivel) => {
    if (tipo === "particular") return "badge badge-particular";
    if (nivel === "avanzado") return "badge badge-avanzado";
    if (nivel === "intermedio") return "badge badge-intermedio";
    return "badge badge-principiante";
  };

  return (
    <>
      <div className="sec-title">Hoy en cancha</div>
      <div className="sec-sub">Sesiones activas del día</div>
      <DateBar selected={fecha} onChange={setFecha} />
      {error && <div className="error-msg">{error}</div>}
      {loading ? (
        <div className="loading">
          <span className="spinner" />
          Cargando...
        </div>
      ) : sesiones.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🎾</div>No hay clases este día
        </div>
      ) : (
        sesiones.map((s) => (
          <div key={s.id} className="session-card">
            <div className="session-time">{fmtH(s.hi)}</div>
            <div style={{ flex: 1 }}>
              <div className="session-name">{s.grupo}</div>
              <div className="session-meta">
                {fmtH(s.hi)} – {fmtH(s.hf)} ·{" "}
                {s.cap ? `${s.reservas}/${s.cap}` : s.reservas} alumnos
              </div>
              <span className={badgeClass(s.tipo, s.nivel)}>
                {s.tipo === "particular" ? "Particular" : s.nivel}
              </span>
            </div>
            {isAdmin && (
              <button className="btn-lista" onClick={() => setDrawer(s)}>
                Lista
              </button>
            )}
          </div>
        ))
      )}
      {drawer && (
        <AsistenciaDrawer
          sesion={drawer}
          onClose={() => setDrawer(null)}
          showToast={showToast}
        />
      )}
    </>
  );
}

// ── LoginScreen (sin credenciales visibles) ─────────────────────────────
// ── Cambiar contraseña ──────────────────────────────────────────────────
function FormCambiarPassword({ onClose, showToast }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async () => {
    if (!actual || !nueva || !confirmar) {
      setError("Completa los 3 campos");
      return;
    }
    if (nueva.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (nueva !== confirmar) {
      setError("La confirmación no coincide");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await Api.cambiarPassword(actual, nueva);
      showToast("Contraseña actualizada ✓");
      onClose();
    } catch (e) {
      setError(e.message || "No se pudo cambiar la contraseña");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="drawer">
        <div className="drawer-handle" />
        <div className="drawer-title">Cambiar contraseña</div>
        <div className="drawer-sub">Actualiza tu acceso a Cancha 10</div>
        {error && <div className="error-msg">{error}</div>}

        <div className="field">
          <label>Contraseña actual</label>
          <input
            type="password"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="field">
          <label>Nueva contraseña</label>
          <input
            type="password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        <div className="field">
          <label>Confirmar nueva contraseña</label>
          <input
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            placeholder="Repite la nueva contraseña"
          />
        </div>

        <button className="btn-save" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando..." : "Actualizar contraseña"}
        </button>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, onMostrarInscripcion }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !pass) {
      setError("Ingresa tu email y contraseña");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await Api.login(email, pass);
      localStorage.setItem("c10_token", data.token);
      localStorage.setItem("c10_usuario", JSON.stringify(data.usuario));
      onLogin(data.usuario);
    } catch (e) {
      setError(e.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="logo-mark">
        <div className="logo-name">Cancha 10</div>
        <div className="gold-line" />
        <div className="logo-sub">Academia de Tenis · Cancún</div>
      </div>
      <div className="login-card">
        <h2>Acceso</h2>
        {error && <div className="error-msg">{error}</div>}
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>
        <button className="btn-login" onClick={handleLogin} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <a
          href={waLink(
            "Hola, olvidé mi contraseña de Cancha 10, ¿me ayudan a restablecerla? 🎾",
          )}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            textAlign: "center",
            marginTop: 12,
            fontSize: 12,
            color: "var(--gr)",
            textDecoration: "underline",
          }}
        >
          ¿Olvidaste tu contraseña?
        </a>
        <button
          onClick={onMostrarInscripcion}
          style={{
            width: "100%",
            marginTop: 12,
            padding: "12px",
            background: "none",
            border: "1.5px solid var(--gold)",
            borderRadius: 8,
            color: "var(--gold)",
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Inscribirme como alumno
        </button>
        <a
          href={waLink("Hola, tengo una pregunta sobre Cancha 10 🎾")}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 16,
            fontSize: 13,
            color: "var(--gr)",
            textDecoration: "none",
          }}
        >
          💬 ¿Dudas? Escríbenos por WhatsApp
        </a>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [tab, setTab] = useState("hoy");
  const [toast, setToast] = useState({ msg: "", err: false });
  const [showInscripcion, setShowInscripcion] = useState(false);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [showCambiarPassword, setShowCambiarPassword] = useState(false);

  // Recuperar sesión guardada al abrir la app
  useEffect(() => {
    const token = localStorage.getItem("c10_token");
    const usuarioGuardado = localStorage.getItem("c10_usuario");
    if (token && usuarioGuardado) {
      try {
        setUsuario(JSON.parse(usuarioGuardado));
      } catch {
        localStorage.removeItem("c10_token");
        localStorage.removeItem("c10_usuario");
      }
    }
    setCargandoSesion(false);
  }, []);

  const showToast = useCallback((msg, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast({ msg: "", err: false }), 2400);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("c10_token");
    localStorage.removeItem("c10_usuario");
    setUsuario(null);
  };

  const handleInscrito = (data) => {
    localStorage.setItem("c10_token", data.token);
    localStorage.setItem("c10_usuario", JSON.stringify(data.usuario));
    setShowInscripcion(false);
    setUsuario(data.usuario);
    showToast("¡Bienvenido a Cancha 10! 🎾");
  };

  if (cargandoSesion) {
    return (
      <div className="login-wrap">
        <div className="loading">
          <span className="spinner" />
          Cargando...
        </div>
      </div>
    );
  }

  if (!usuario)
    return (
      <>
        <LoginScreen
          onLogin={(u) => setUsuario(u)}
          onMostrarInscripcion={() => setShowInscripcion(true)}
        />
        {showInscripcion && (
          <FormInscripcion
            onClose={() => setShowInscripcion(false)}
            onInscrito={handleInscrito}
          />
        )}
        <Toast msg={toast.msg} err={toast.err} />
      </>
    );

  const isAdmin = usuario.rol === "admin";
  const tabs = isAdmin
    ? [
        { id: "hoy", icon: "📅", label: "Hoy" },
        { id: "alumnos", icon: "👥", label: "Alumnos" },
        { id: "horarios", icon: "🗓️", label: "Horarios" },
        { id: "pagos", icon: "💳", label: "Pagos" },
      ]
    : [
        { id: "hoy", icon: "📅", label: "Hoy" },
        { id: "mi", icon: "👤", label: "Mi espacio" },
      ];

  return (
    <div className="shell">
      <div className="topbar">
        <div className="topbar-brand">
          <span className="topbar-logo">Cancha 10</span>
          <div className="topbar-sep" />
          <span className="topbar-name">{usuario.nombre}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            className="topbar-out"
            onClick={() => setShowCambiarPassword(true)}
          >
            ⚙️ Cuenta
          </div>
          <div className="topbar-out" onClick={handleLogout}>
            Salir →
          </div>
        </div>
      </div>

      {showCambiarPassword && (
        <FormCambiarPassword
          onClose={() => setShowCambiarPassword(false)}
          showToast={showToast}
        />
      )}

      <div className="content">
        {tab === "hoy" && <ViewHoy isAdmin={isAdmin} showToast={showToast} />}
        {tab === "alumnos" && isAdmin && <ViewAlumnos showToast={showToast} />}
        {tab === "horarios" && isAdmin && (
          <>
            <ViewHorarios showToast={showToast} />
            <div
              style={{
                marginTop: 24,
                borderTop: "1px solid #1A1A1A",
                paddingTop: 20,
              }}
            >
              <ViewPaquetes showToast={showToast} />
            </div>
          </>
        )}
        {tab === "pagos" && isAdmin && <ViewPagos showToast={showToast} />}
        {tab === "mi" && !isAdmin && (
          <ViewMiEspacio usuario={usuario} showToast={showToast} />
        )}
      </div>

      <WhatsAppButton />

      <nav className="bottomnav">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`nav-btn ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <Toast msg={toast.msg} err={toast.err} />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import Api from "../api";

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

const NIVELES = [
  { id: 1, label: "Principiante" },
  { id: 2, label: "Intermedio" },
  { id: 3, label: "Avanzado" },
];

const TIPOS_CLASE = [
  { value: "grupal", label: "Grupal" },
  { value: "particular", label: "Particular" },
];

function inits(nombre = "") {
  return nombre
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function fmtFechaCorta(iso) {
  if (!iso) return "";
  const base = iso.includes("T") ? iso.split("T")[0] : iso;
  const d = new Date(base + "T12:00:00");
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

function separarNombre(nombreCompleto = "") {
  const partes = nombreCompleto.trim().split(" ").filter(Boolean);
  if (partes.length <= 1) return { nombre: partes[0] || "", apellido: "" };
  return {
    nombre: partes.slice(0, -1).join(" "),
    apellido: partes.slice(-1).join(" "),
  };
}

function normalizarPagoTag(estado) {
  if (!estado || estado === "sin_pago") return "pendiente";
  return estado;
}

function obtenerMontoAlumno(alumno = {}) {
  return (
    alumno.monto ||
    alumno.precio_sesion_o_mes ||
    alumno.precio_mensual ||
    alumno.precio_clase ||
    0
  );
}

function EditarAlumnoModal({ alumno, detalle, onClose, onGuardado }) {
  const nombreBase = separarNombre(alumno?.n || alumno?.nombre_completo || "");
  const nivelActual = detalle?.nivel || alumno?.nivel || "";

  const nivelIdInicial =
    nivelActual === "intermedio" ? 2 : nivelActual === "avanzado" ? 3 : 1;

  const [form, setForm] = useState({
    nombre: detalle?.nombre || nombreBase.nombre || "",
    apellido: detalle?.apellido || nombreBase.apellido || "",
    telefono: detalle?.telefono || alumno?.telefono || "",
    email: detalle?.email || alumno?.email || "",
    nivel_id: detalle?.nivel_id || alumno?.nivel_id || nivelIdInicial,
    tipo_clase: detalle?.tipo_clase || alumno?.tipo_clase || "grupal",
    notas: detalle?.notas || alumno?.notas || "",
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      await Api.actualizarAlumno(alumno.id, {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim(),
        nivel_id: form.nivel_id ? parseInt(form.nivel_id, 10) : null,
        tipo_clase: form.tipo_clase,
        notas: form.notas,
      });

      onGuardado();
    } catch (e) {
      setError(e.message || "No se pudo actualizar el alumno");
    } finally {
      setGuardando(false);
    }
  };

  const selStyle = {
    width: "100%",
    padding: "11px 13px",
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
        <div className="drawer-title">Editar alumno</div>
        <div className="drawer-sub">
          Actualiza los datos principales del expediente
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div className="field">
          <label>Nombre(s) *</label>
          <input
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Apellido(s)</label>
          <input
            value={form.apellido}
            onChange={(e) => set("apellido", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Email</label>
          <input value={form.email} disabled />
          <div style={{ fontSize: 11, color: "var(--gr)", marginTop: 4 }}>
            El cambio de email lo habilitaremos en el siguiente ajuste de
            backend.
          </div>
        </div>

        <div className="field">
          <label>Teléfono</label>
          <input
            value={form.telefono}
            onChange={(e) => set("telefono", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Nivel</label>
          <select
            value={form.nivel_id || ""}
            onChange={(e) => set("nivel_id", e.target.value)}
            style={selStyle}
          >
            {NIVELES.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Tipo de clase</label>
          <select
            value={form.tipo_clase}
            onChange={(e) => set("tipo_clase", e.target.value)}
            style={selStyle}
          >
            {TIPOS_CLASE.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Notas administrativas</label>
          <textarea
            value={form.notas}
            onChange={(e) => set("notas", e.target.value)}
            rows={4}
            placeholder="Notas internas del alumno..."
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

        <button className="btn-save" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar cambios"}
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

function FormFeedbackLocal({ onClose, onGuardar }) {
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
function RegistrarPagoModal({
  alumno,
  onClose,
  onGuardar,
  pagoInicial = null,
}) {
  const [form, setForm] = useState({
    tipo: pagoInicial?.tipo || "mensualidad",
    monto: pagoInicial?.monto || alumno.monto || "",
    metodo_pago: pagoInicial?.metodo_pago || "efectivo",
    periodo_inicio: pagoInicial?.periodo_inicio
      ? pagoInicial.periodo_inicio.split("T")[0]
      : "",
    periodo_fin: pagoInicial?.periodo_fin
      ? pagoInicial.periodo_fin.split("T")[0]
      : "",
    notas: pagoInicial?.notas || "",
  });

  const [guardando, setGuardando] = useState(false);
  useEffect(() => {
    if (!alumno) return;

    const diaPago = Number(alumno.dia_pago_efectivo || alumno.dia_pago || 1);

    let inicio;

    if (alumno.fecha_vencimiento) {
      const vencimientoAnterior = new Date(alumno.fecha_vencimiento);

      inicio = new Date(
        vencimientoAnterior.getFullYear(),
        vencimientoAnterior.getMonth(),
        diaPago,
      );
    } else {
      const hoy = new Date();

      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), diaPago);
    }

    const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, diaPago);

    const formato = (fecha) => {
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
      const dia = String(fecha.getDate()).padStart(2, "0");

      return `${año}-${mes}-${dia}`;
    };

    setForm((prev) => ({
      ...prev,
      monto:
        alumno.precio_mensual ||
        alumno.precio_sesion_o_mes ||
        alumno.monto ||
        prev.monto,

      periodo_inicio: formato(inicio),
      periodo_fin: formato(fin),
    }));
  }, [alumno]);
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const guardar = async () => {
    if (!form.monto || Number(form.monto) <= 0) {
      alert("Ingresa un monto válido");
      return;
    }

    setGuardando(true);

    await onGuardar({
      ...form,
      monto: Number(form.monto),
    });

    setGuardando(false);
  };

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="drawer">
        <div className="drawer-handle" />
        <div className="drawer-title">Registrar pago</div>
        <div className="drawer-sub">{alumno.n || alumno.nombre_completo}</div>

        <div className="field">
          <label>Concepto</label>
          <select
            value={form.tipo}
            onChange={(e) => set("tipo", e.target.value)}
          >
            <option value="mensualidad">Mensualidad</option>
            <option value="inscripcion">Inscripción</option>
            <option value="clase_particular">Clase particular</option>
            <option value="torneo">Torneo</option>
            <option value="tienda">Tienda</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div className="field">
          <label>Monto</label>
          <input
            type="number"
            value={form.monto}
            onChange={(e) => set("monto", e.target.value)}
            placeholder="Ej. 1600"
          />
        </div>

        <div className="field">
          <label>Método de pago</label>
          <select
            value={form.metodo_pago}
            onChange={(e) => set("metodo_pago", e.target.value)}
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="mercado_pago">Mercado Pago</option>
          </select>
        </div>

        <div className="field">
          <label>Periodo inicio</label>
          <input
            type="date"
            value={form.periodo_inicio}
            onChange={(e) => set("periodo_inicio", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Periodo fin</label>
          <input
            type="date"
            value={form.periodo_fin}
            onChange={(e) => set("periodo_fin", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Observaciones</label>
          <textarea
            value={form.notas}
            onChange={(e) => set("notas", e.target.value)}
            rows={3}
            placeholder="Notas del pago..."
          />
        </div>

        <button className="btn-save" onClick={guardar} disabled={guardando}>
          {guardando ? "Registrando..." : "Registrar pago"}
        </button>

        <button onClick={onClose} style={{ marginTop: 10, width: "100%" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
export default function AlumnoExpediente({
  alumno,
  onClose,
  onEliminar,
  onActualizar,
  FichaTecnicaComponent,
  showToast,
}) {
  const [confirmar, setConfirmar] = useState(false);
  const [showAgregarInscripcion, setShowAgregarInscripcion] = useState(false);
  const [clasesDisponibles, setClasesDisponibles] = useState([]);
  const [paquetesDisponibles, setPaquetesDisponibles] = useState([]);
  const [paqueteSeleccionado, setPaqueteSeleccionado] = useState("");
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("");
  const [claseIdsSeleccionadas, setClaseIdsSeleccionadas] = useState([]);
  const [inscripcionEditando, setInscripcionEditando] = useState(null);
  const [claseIdsEditando, setClaseIdsEditando] = useState([]);
  const [showFicha, setShowFicha] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [tab, setTab] = useState("datos");
  const [objetivoActual, setObjetivoActual] = useState(
    "Mejorar consistencia del segundo saque.",
  );

  const [feedback, setFeedback] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [showRegistrarPago, setShowRegistrarPago] = useState(false);
  const [showEditarPago, setShowEditarPago] = useState(false);
  const [pagoEditando, setPagoEditando] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(true);

  const [passwordTemp, setPasswordTemp] = useState(null);
  const [restableciendo, setRestableciendo] = useState(false);

  const [editandoDiaPago, setEditandoDiaPago] = useState(false);
  const [diaPago, setDiaPago] = useState(
    alumno.dia_pago || alumno.dia_pago_efectivo || "",
  );
  const [guardandoDia, setGuardandoDia] = useState(false);

  const pagoEstado = normalizarPagoTag(
    alumno.pago || alumno.ultimo_pago_estado,
  );
  const monto = obtenerMontoAlumno(alumno) || Number(pagos[0]?.monto || 0);

  const cargarDetalle = () => {
    setLoadingDetalle(true);

    Promise.all([
      Api.listarFeedback(alumno.id).catch(() => []),
      Api.obtenerAlumno(alumno.id).catch(() => null),
      Api.asistenciaAlumno(alumno.id).catch(() => []),
    ])
      .then(([fb, det, asist]) => {
        setFeedback(fb || []);
        setDetalle(det);
        setPagos(det?.historial_pagos || []);
        setAsistencias(asist || []);
      })
      .finally(() => setLoadingDetalle(false));
  };

  useEffect(() => {
    cargarDetalle();
    Api.horario()
      .then(setClasesDisponibles)
      .catch(() => setClasesDisponibles([]));

    Api.listarPaquetes()
      .then(setPaquetesDisponibles)
      .catch(() => setPaquetesDisponibles([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumno.id]);

  const guardarDiaPago = async () => {
    const dia = parseInt(diaPago, 10);

    if (!dia || dia < 1 || dia > 31) {
      alert("Día debe ser entre 1 y 31");
      return;
    }

    if (!alumno.inscripcion_id) {
      alert("Este alumno no tiene una inscripción activa");
      return;
    }

    setGuardandoDia(true);

    try {
      await Api.actualizarDiaPago(alumno.inscripcion_id, dia);
      setEditandoDiaPago(false);
      showToast?.("Día de pago actualizado ✓");
      onActualizar();
      cargarDetalle();
    } catch (e) {
      alert(e.message || "No se pudo actualizar el día de pago");
    } finally {
      setGuardandoDia(false);
    }
  };

  const restablecerPassword = async () => {
    setRestableciendo(true);

    try {
      const data = await Api.resetearPassword(alumno.id);
      setPasswordTemp(data.password_temporal);
    } catch (e) {
      alert(e.message || "No se pudo restablecer la contraseña");
    } finally {
      setRestableciendo(false);
    }
  };

  const guardarFicha = () => {
    setShowFicha(false);
    showToast?.("Ficha actualizada ✓");
    onActualizar();
    cargarDetalle();
  };

  const agregarFeedback = async (texto) => {
    try {
      await Api.agregarFeedback(alumno.id, texto);
      setShowFeedback(false);
      showToast?.("Retroalimentación agregada ✓");
      cargarDetalle();
    } catch (e) {
      alert(e.message || "No se pudo guardar el comentario");
    }
  };

  const guardarEdicionAlumno = () => {
    setShowEditar(false);
    showToast?.("Alumno actualizado ✓");
    onActualizar();
    cargarDetalle();
  };

  const registrarPago = async (datosPago) => {
    try {
      await Api.registrarPago({
        alumno_id: detalle?.alumno_id,
        inscripcion_id: detalle?.inscripcion_id || null,
        tipo: datosPago.tipo,
        monto: datosPago.monto,
        metodo_pago: datosPago.metodo_pago,
        periodo_inicio: datosPago.periodo_inicio || null,
        periodo_fin: datosPago.periodo_fin || null,
        notas: datosPago.notas || null,
      });

      setShowRegistrarPago(false);
      showToast?.("Pago registrado ✓");
      onActualizar();
      cargarDetalle();
    } catch (e) {
      alert(e.message || "No se pudo registrar el pago");
    }
  };
  const Tabs = useMemo(
    () => [
      { id: "datos", label: "👤 Datos" },
      { id: "progreso", label: "🎾 Progreso" },
      { id: "pagos", label: "💳 Pagos" },
      { id: "asistencias", label: "📅 Asistencias" },
      { id: "clases", label: "🎾 Clases" },
    ],
    [],
  );

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="drawer" style={{ maxHeight: "92dvh" }}>
        <div className="drawer-handle" />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 16,
          }}
        >
          <div
            className="avatar"
            style={{ width: 52, height: 52, fontSize: 18 }}
          >
            {inits(alumno.n || alumno.nombre_completo)}
          </div>

          <div style={{ flex: 1 }}>
            <div className="drawer-title" style={{ marginBottom: 2 }}>
              {alumno.n || alumno.nombre_completo}
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span className={`pago-tag tag-${pagoEstado}`}>{pagoEstado}</span>
              {alumno.estado_inscripcion && (
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 20,
                    background: "#151515",
                    border: "1px solid #2A2A2A",
                    color: "var(--gr)",
                    fontSize: 11,
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  {alumno.estado_inscripcion}
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div className="stat-box" style={{ padding: "12px 8px" }}>
            <div className="stat-num gold" style={{ fontSize: 20 }}>
              {alumno.nivel || detalle?.nivel || "—"}
            </div>
            <div className="stat-lbl">Nivel</div>
          </div>

          <div className="stat-box" style={{ padding: "12px 8px" }}>
            <div className="stat-num ok" style={{ fontSize: 20 }}>
              ${parseFloat(monto || 0).toLocaleString()}
            </div>
            <div className="stat-lbl">
              {alumno.tipo_cobro === "por_sesion" ||
              alumno.tipo_clase === "particular"
                ? "Pago por paquete"
                : "Mensual"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            marginBottom: 12,
            paddingBottom: 2,
          }}
        >
          {Tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                whiteSpace: "nowrap",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #2A2A2A",
                background: tab === t.id ? "var(--gold)" : "var(--bk2)",
                color: tab === t.id ? "var(--bk)" : "var(--gr)",
                fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "datos" && (
          <>
            <div className="card" style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div className="card-label" style={{ marginBottom: 0 }}>
                  Datos generales
                </div>
                <button
                  onClick={() => setShowEditar(true)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: "1px solid #2A2A2A",
                    background: "none",
                    color: "var(--gold)",
                    fontSize: 12,
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  ✏️ Editar alumno
                </button>
              </div>

              {(alumno.email || detalle?.email) && (
                <div className="pago-row" style={{ padding: "8px 0" }}>
                  <span style={{ fontSize: 12, color: "var(--gr)" }}>
                    Email
                  </span>
                  <span style={{ fontSize: 13, color: "var(--wh)" }}>
                    {alumno.email || detalle?.email}
                  </span>
                </div>
              )}

              {(alumno.telefono || detalle?.telefono) && (
                <div className="pago-row" style={{ padding: "8px 0" }}>
                  <span style={{ fontSize: 12, color: "var(--gr)" }}>
                    Teléfono
                  </span>
                  <span style={{ fontSize: 13, color: "var(--wh)" }}>
                    {alumno.telefono || detalle?.telefono}
                  </span>
                </div>
              )}

              <div className="pago-row" style={{ padding: "8px 0" }}>
                <span style={{ fontSize: 12, color: "var(--gr)" }}>
                  Tipo de clase
                </span>
                <span style={{ fontSize: 13, color: "var(--wh)" }}>
                  {alumno.tipo_clase || detalle?.tipo_clase || "—"}
                </span>
              </div>

              <div className="pago-row" style={{ padding: "8px 0" }}>
                <span style={{ fontSize: 12, color: "var(--gr)" }}>Grupo</span>
                <span style={{ fontSize: 13, color: "var(--wh)" }}>
                  {alumno.grupo || detalle?.grupo || "—"}
                </span>
              </div>

              <div
                className="pago-row"
                style={{ padding: "8px 0", borderBottom: "none" }}
              >
                <span style={{ fontSize: 12, color: "var(--gr)" }}>
                  Paquete
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--gold)",
                    fontWeight: 700,
                  }}
                >
                  {alumno.paquete || detalle?.paquete || "—"}
                </span>
              </div>
            </div>
            {Array.isArray(detalle?.inscripciones) &&
              detalle.inscripciones.length > 0 && (
                <div className="card" style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--gr)",
                      marginBottom: 10,
                    }}
                  >
                    INSCRIPCIONES ACTIVAS
                  </div>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowAgregarInscripcion(true)}
                    style={{
                      width: "100%",
                      marginBottom: 10,
                    }}
                  >
                    + Agregar clase
                  </button>
                  {detalle.inscripciones.map((inscripcion) => (
                    <div
                      key={inscripcion.id}
                      style={{
                        padding: "12px 0",
                        borderBottom: "1px solid #2A2A2A",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 12,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              color: "var(--wh)",
                              fontSize: 14,
                              fontWeight: 700,
                            }}
                          >
                            {inscripcion.grupo || "Clase sin grupo"}
                          </div>

                          <div
                            style={{
                              color: "var(--gold)",
                              fontSize: 13,
                              marginTop: 3,
                            }}
                          >
                            {inscripcion.paquete || "Sin paquete"}
                          </div>

                          {inscripcion.fecha_inicio && (
                            <div
                              style={{
                                color: "var(--gr)",
                                fontSize: 11,
                                marginTop: 4,
                              }}
                            >
                              Desde: {fmtFechaCorta(inscripcion.fecha_inicio)}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            const confirmarBaja = window.confirm(
                              `¿Dar de baja la inscripción "${
                                inscripcion.grupo || "Clase sin grupo"
                              }"?`,
                            );

                            if (!confirmarBaja) return;

                            const motivo = window.prompt(
                              "Motivo de la baja (opcional):",
                              "",
                            );

                            if (motivo === null) return;

                            try {
                              await Api.darDeBajaInscripcion(inscripcion.id, {
                                fecha_fin: new Date()
                                  .toISOString()
                                  .split("T")[0],
                                motivo: motivo.trim() || null,
                              });

                              await cargarDetalle();
                              onActualizar?.();
                              showToast?.("Inscripción dada de baja ✓");
                            } catch (e) {
                              alert(
                                e.message ||
                                  "No se pudo dar de baja la inscripción",
                              );
                            }
                          }}
                          style={{
                            padding: "6px 9px",
                            borderRadius: 6,
                            border: "1px solid var(--danger)",
                            background: "transparent",
                            color: "var(--danger)",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Dar de baja
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInscripcionEditando(inscripcion);

                            const clasesActuales = Array.isArray(
                              inscripcion.clase_ids,
                            )
                              ? inscripcion.clase_ids.map(Number)
                              : [];

                            setClaseIdsEditando(clasesActuales);
                          }}
                          style={{
                            padding: "6px 9px",
                            borderRadius: 6,
                            border: "1px solid var(--gold)",
                            background: "transparent",
                            color: "var(--gold)",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            marginLeft: 8,
                          }}
                        >
                          Editar clases
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            {/* Estado financiero */}
            <div
              className="card"
              style={{
                marginBottom: 10,
                borderColor:
                  detalle?.estado_pago === "al_corriente"
                    ? "var(--ok)"
                    : detalle?.estado_pago === "atrasado"
                      ? "var(--danger)"
                      : "var(--gold)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--gr)",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 5,
                    }}
                  >
                    Estado financiero
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color:
                        detalle?.estado_pago === "al_corriente"
                          ? "var(--ok)"
                          : detalle?.estado_pago === "atrasado"
                            ? "var(--danger)"
                            : "var(--gold)",
                      marginBottom: 6,
                    }}
                  >
                    {detalle?.estado_pago === "al_corriente"
                      ? "AL CORRIENTE"
                      : detalle?.estado_pago === "atrasado"
                        ? "ATRASADO"
                        : "SIN PAGO"}
                  </div>

                  <div style={{ fontSize: 13, color: "var(--gr)" }}>
                    {detalle?.fecha_vencimiento
                      ? `Vence: ${new Date(detalle.fecha_vencimiento).toLocaleDateString()}`
                      : "Sin fecha de vencimiento"}
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--w)",
                    }}
                  >
                    {detalle?.estado_pago === "al_corriente"
                      ? `${detalle?.dias_estado ?? 0} días restantes`
                      : `${detalle?.dias_estado ?? 0} días de atraso`}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 19,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      color:
                        detalle?.estado_pago === "al_corriente"
                          ? "var(--ok)"
                          : detalle?.estado_pago === "atrasado"
                            ? "var(--danger)"
                            : "var(--gold)",
                    }}
                  ></div>
                </div>

                <div style={{ textAlign: "right" }} />
              </div>
            </div>

            {/* Día de pago */}

            <div className="card" style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: "var(--gr)" }}>
                    {(detalle?.tipo_clase || alumno.tipo_clase) === "particular"
                      ? "Renovación"
                      : "Día de pago"}
                  </div>

                  {!editandoDiaPago ? (
                    <div
                      style={{
                        fontSize: 16,
                        fontFamily: "'Barlow Condensed',sans-serif",
                        fontWeight: 700,
                        color: "var(--wh)",
                        marginTop: 2,
                      }}
                    >
                      {(detalle?.tipo_clase || alumno.tipo_clase) ===
                      "particular" ? (
                        "Renovación por paquete"
                      ) : (
                        <>
                          Día{" "}
                          <span style={{ color: "var(--gold)" }}>
                            {alumno.dia_pago || alumno.dia_pago_efectivo || "-"}
                          </span>{" "}
                          de cada mes
                        </>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        marginTop: 6,
                      }}
                    >
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={diaPago}
                        onChange={(e) => setDiaPago(e.target.value)}
                        style={{
                          width: 60,
                          padding: "7px 10px",
                          border: "1px solid #2A2A2A",
                          borderRadius: 7,
                          fontFamily: "inherit",
                          fontSize: 15,
                          color: "var(--wh)",
                          background: "var(--bk3)",
                          textAlign: "center",
                        }}
                      />

                      <button
                        onClick={guardarDiaPago}
                        disabled={guardandoDia}
                        style={{
                          padding: "7px 14px",
                          background: "var(--gold)",
                          border: "none",
                          borderRadius: 7,
                          color: "var(--bk)",
                          fontFamily: "'Barlow Condensed',sans-serif",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {guardandoDia ? "..." : "Guardar"}
                      </button>

                      <button
                        onClick={() => setEditandoDiaPago(false)}
                        style={{
                          padding: "7px 10px",
                          background: "none",
                          border: "1px solid #2A2A2A",
                          borderRadius: 7,
                          color: "var(--gr)",
                          fontFamily: "inherit",
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {(detalle?.tipo_clase || alumno.tipo_clase) !== "particular" &&
                  !editandoDiaPago && (
                    <button
                      onClick={() => setEditandoDiaPago(true)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 6,
                        border: "1px solid #2A2A2A",
                        background: "none",
                        color: "var(--gr)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      ✏️ Día
                    </button>
                  )}
              </div>
            </div>

            <button
              onClick={() => setShowFicha(true)}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: 8,
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
              🎾 Ver / editar ficha técnica
            </button>

            <div className="card" style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div className="card-label" style={{ marginBottom: 0 }}>
                  Retroalimentación
                </div>
                <button
                  onClick={() => setShowFeedback(true)}
                  style={{
                    padding: "4px 10px",
                    background: "var(--gold)",
                    border: "none",
                    borderRadius: 6,
                    color: "var(--bk)",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Agregar
                </button>
              </div>

              {loadingDetalle ? (
                <div style={{ fontSize: 12, color: "var(--gr)" }}>
                  Cargando...
                </div>
              ) : feedback.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--gr)" }}>
                  Sin comentarios todavía
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
                      style={{
                        fontSize: 13,
                        color: "var(--wh)",
                        lineHeight: 1.5,
                      }}
                    >
                      {f.texto}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "var(--gr)", marginTop: 4 }}
                    >
                      {f.autor} ·{" "}
                      {fmtFechaCorta((f.created_at || "").split("T")[0])}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
        {tab === "progreso" && (
          <>
            <div className="card" style={{ marginBottom: 10 }}>
              <div className="card-label">🎯 Objetivo actual</div>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                Mejorar consistencia del segundo saque.
              </div>

              <button
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: 12,
                  background: "var(--gold)",
                  border: "none",
                  borderRadius: 8,
                  color: "var(--bk)",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                Actualizar
              </button>
            </div>

            <div className="card">
              <div className="card-label">📝 Última observación</div>

              <div
                style={{
                  marginTop: 10,
                  lineHeight: 1.5,
                }}
              >
                Excelente actitud durante la sesión.
                <br />
                Empieza a subir a la red con mayor confianza.
              </div>

              <button
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: 12,
                  background: "var(--gold)",
                  border: "none",
                  borderRadius: 8,
                  color: "var(--bk)",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                Registrar observación
              </button>
            </div>
          </>
        )}
        {tab === "pagos" && (
          <div className="card" style={{ marginBottom: 10 }}>
            <button
              onClick={() => setShowRegistrarPago(true)}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: 12,
                background: "var(--gold)",
                border: "none",
                borderRadius: 8,
                color: "var(--bk)",
                fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              💳 Registrar pago
            </button>
            <div className="card-label">Historial de pagos</div>

            {loadingDetalle ? (
              <div style={{ fontSize: 12, color: "var(--gr)" }}>
                Cargando...
              </div>
            ) : pagos.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--gr)" }}>
                Sin pagos registrados
              </div>
            ) : (
              pagos.map((p) => (
                <div key={p.id} className="pago-row">
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--gr)",
                        textTransform: "uppercase",
                        marginBottom: 2,
                        fontWeight: 700,
                      }}
                    >
                      {p.tipo || "Pago"}
                    </div>

                    <div style={{ fontSize: 13, color: "var(--wh)" }}>
                      ${parseFloat(p.monto || 0).toLocaleString()}
                    </div>

                    <div style={{ fontSize: 11, color: "var(--gr)" }}>
                      {p.periodo_inicio
                        ? `${fmtFechaCorta(p.periodo_inicio)}${
                            p.periodo_fin
                              ? ` - ${fmtFechaCorta(p.periodo_fin)}`
                              : ""
                          }`
                        : fmtFechaCorta((p.created_at || "").split("T")[0])}
                    </div>

                    {p.metodo_pago && (
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--gr)",
                          marginTop: 2,
                          textTransform: "capitalize",
                        }}
                      >
                        {p.metodo_pago}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-mini"
                    onClick={() => {
                      setPagoEditando(p);
                      setShowEditarPago(true);
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    className="btn-mini"
                    style={{ marginLeft: 8, color: "#ff5b5b" }}
                    onClick={async () => {
                      if (!window.confirm("¿Eliminar este pago?")) return;

                      try {
                        await Api.eliminarPago(p.id);
                        await cargarDetalle();
                      } catch (e) {
                        alert(e.message || "No se pudo eliminar");
                      }
                    }}
                  >
                    🗑 Eliminar
                  </button>
                  <span className={`pago-tag tag-${p.estado}`}>{p.estado}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "asistencias" && (
          <div className="card" style={{ marginBottom: 10 }}>
            <div className="card-label">Asistencias</div>
            <div className="pago-row" style={{ marginBottom: 12 }}>
              <div>
                <strong>{asistencias.length}</strong>

                <br />

                <span style={{ color: "var(--gr)", fontSize: 12 }}>
                  registros
                </span>
              </div>

              <div style={{ textAlign: "right" }}>
                <strong style={{ color: "#37d67a" }}>
                  {asistencias.filter((a) => a.estado === "asistio").length}
                </strong>

                <span
                  style={{
                    color: "var(--gr)",
                    fontSize: 12,
                    display: "block",
                  }}
                >
                  asistencias
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong style={{ color: "#ff5c5c" }}>
                  {asistencias.filter((a) => a.estado === "falta").length}
                </strong>

                <span
                  style={{
                    color: "var(--gr)",
                    fontSize: 12,
                    display: "block",
                  }}
                >
                  faltas
                </span>
              </div>
            </div>

            {asistencias.length === 0 ? (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--gr)",
                  lineHeight: 1.5,
                }}
              >
                Aún no hay asistencias registradas.
              </div>
            ) : (
              <div>
                {asistencias.map((a, i) => (
                  <div
                    key={i}
                    className="pago-row"
                    style={{ padding: "10px 0" }}
                  >
                    <div>
                      <strong>
                        {a.fecha
                          ? new Date(a.fecha).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </strong>
                      <br />
                      <span style={{ color: "var(--gr)", fontSize: 12 }}>
                        {a.clase || a.grupo || "Clase"}
                      </span>
                      <br />

                      <span style={{ color: "var(--gr)", fontSize: 12 }}>
                        {a.hora_inicio && a.hora_fin
                          ? `${a.hora_inicio.slice(0, 5)} - ${a.hora_fin.slice(0, 5)}`
                          : ""}
                      </span>
                    </div>

                    <div
                      style={{
                        color: a.estado === "asistio" ? "#37d67a" : "#ff5c5c",
                        fontWeight: 700,
                      }}
                    >
                      {a.estado === "asistio" ? "✓ Asistió" : "✕ Ausente"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "clases" && (
          <div className="card" style={{ marginBottom: 10 }}>
            <div className="card-label">Clases</div>
            <div className="pago-row" style={{ padding: "8px 0" }}>
              <span style={{ fontSize: 12, color: "var(--gr)" }}>
                Grupo actual
              </span>
              <span style={{ fontSize: 13, color: "var(--wh)" }}>
                {alumno.grupo || detalle?.grupo || "—"}
              </span>
            </div>
            <div
              className="pago-row"
              style={{ padding: "8px 0", borderBottom: "none" }}
            >
              <span style={{ fontSize: 12, color: "var(--gr)" }}>Tipo</span>
              <span style={{ fontSize: 13, color: "var(--wh)" }}>
                {alumno.tipo_clase || detalle?.tipo_clase || "—"}
              </span>
            </div>
          </div>
        )}

        {passwordTemp && (
          <div
            className="card"
            style={{
              marginBottom: 10,
              borderColor: "var(--gold)",
              background: "rgba(201,161,76,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--gr)",
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              Nueva contraseña temporal — compártela con el alumno:
            </div>

            <div
              style={{
                fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: 20,
                fontWeight: 800,
                color: "var(--gold)",
                letterSpacing: 1,
                textAlign: "center",
                padding: "8px 0",
              }}
            >
              {passwordTemp}
            </div>

            <button
              onClick={() => setPasswordTemp(null)}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "8px",
                background: "none",
                border: "1px solid #2A2A2A",
                borderRadius: 6,
                color: "var(--gr)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </div>
        )}

        <button
          onClick={restablecerPassword}
          disabled={restableciendo}
          style={{
            width: "100%",
            padding: "11px",
            marginBottom: 8,
            background: "none",
            border: "1px solid #2A2A2A",
            borderRadius: 8,
            color: "var(--gr)",
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          {restableciendo ? "Generando..." : "🔑 Restablecer contraseña"}
        </button>

        {!confirmar ? (
          <button
            onClick={() => setConfirmar(true)}
            style={{
              width: "100%",
              padding: "12px",
              background: "none",
              border: "1px solid var(--danger)",
              borderRadius: 8,
              color: "var(--danger)",
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Eliminar alumno
          </button>
        ) : (
          <div
            style={{
              background: "#1A0A0A",
              border: "1px solid var(--danger)",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "var(--wh)",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              ¿Confirmas que quieres eliminar a{" "}
              <strong>{alumno.n || alumno.nombre_completo}</strong>?
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setConfirmar(false)}
                style={{
                  flex: 1,
                  padding: "10px",
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
                onClick={() => onEliminar(alumno.id)}
                style={{
                  flex: 1,
                  padding: "10px",
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
                Sí, eliminar
              </button>
            </div>
          </div>
        )}

        {showRegistrarPago && (
          <RegistrarPagoModal
            alumno={{ ...alumno, ...detalle }}
            onClose={() => setShowRegistrarPago(false)}
            onGuardar={registrarPago}
          />
        )}
        {showEditarPago && pagoEditando && (
          <RegistrarPagoModal
            alumno={{ ...alumno, ...detalle }}
            pagoInicial={pagoEditando}
            onClose={() => {
              setShowEditarPago(false);
              setPagoEditando(null);
            }}
            onGuardar={async (datos) => {
              try {
                await Api.editarPago(pagoEditando.id, datos);

                setShowEditarPago(false);
                setPagoEditando(null);

                await cargarDetalle();
                onActualizar?.();
                showToast?.("Pago actualizado correctamente");
              } catch (e) {
                alert(e.message || "No se pudo actualizar el pago");
              }
            }}
          />
        )}
        {showEditar && (
          <EditarAlumnoModal
            alumno={alumno}
            detalle={detalle}
            onClose={() => setShowEditar(false)}
            onGuardado={guardarEdicionAlumno}
          />
        )}

        {showFicha && FichaTecnicaComponent && (
          <FichaTecnicaComponent
            alumnoId={alumno.id}
            nombreAlumno={alumno.n || alumno.nombre_completo}
            isAdmin={true}
            onGuardar={guardarFicha}
            onClose={() => setShowFicha(false)}
          />
        )}

        {showFeedback && (
          <FormFeedbackLocal
            onClose={() => setShowFeedback(false)}
            onGuardar={agregarFeedback}
          />
        )}
        {showAgregarInscripcion && (
          <div
            className="overlay"
            onClick={(e) =>
              e.target === e.currentTarget && setShowAgregarInscripcion(false)
            }
          >
            <div className="drawer" style={{ maxHeight: "70dvh" }}>
              <div className="drawer-handle" />

              <div className="drawer-title">Agregar inscripción</div>
              <div className="field" style={{ marginTop: 12 }}>
                <div className="field">
                  <label>Grupo</label>

                  <select
                    value={grupoSeleccionado}
                    onChange={(e) => setGrupoSeleccionado(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 13px",
                      borderRadius: 8,
                      border: "1px solid #2A2A2A",
                      background: "var(--bk3)",
                      color: "var(--wh)",
                    }}
                  >
                    <option value="">Selecciona un grupo</option>

                    {clasesDisponibles.map((clase) => (
                      <option
                        key={clase.clase_id || clase.id}
                        value={clase.grupo_id || clase.id}
                      >
                        {clase.grupo || clase.nombre || "Grupo sin nombre"}
                      </option>
                    ))}
                  </select>
                </div>
                {grupoSeleccionado && (
                  <div style={{ marginTop: 12 }}>
                    <label>Clases asignadas</label>

                    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                      {clasesDisponibles
                        .filter(
                          (clase) =>
                            String(clase.grupo_id || clase.id) ===
                            String(grupoSeleccionado),
                        )
                        .map((clase) => {
                          const claseId = clase.clase_id || clase.id;
                          const seleccionada =
                            claseIdsSeleccionadas.includes(claseId);

                          return (
                            <label
                              key={claseId}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: 10,
                                border: "1px solid #2A2A2A",
                                borderRadius: 8,
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={seleccionada}
                                onChange={() => {
                                  setClaseIdsSeleccionadas((prev) =>
                                    seleccionada
                                      ? prev.filter((id) => id !== claseId)
                                      : [...prev, claseId],
                                  );
                                }}
                              />

                              <span>
                                {clase.dia || clase.dia_semana || "Día"}{" "}
                                {clase.hora_inicio || ""}{" "}
                                {clase.hora_fin ? `- ${clase.hora_fin}` : ""}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
                <label>Paquete</label>

                <select
                  value={paqueteSeleccionado}
                  onChange={(e) => setPaqueteSeleccionado(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 13px",
                    borderRadius: 8,
                    border: "1px solid #2A2A2A",
                    background: "var(--bk3)",
                    color: "var(--wh)",
                  }}
                >
                  <option value="">Selecciona un paquete</option>

                  {paquetesDisponibles.map((paquete) => (
                    <option key={paquete.id} value={paquete.id}>
                      {paquete.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="btn-save"
                onClick={async () => {
                  if (!grupoSeleccionado || !paqueteSeleccionado) {
                    alert("Selecciona un grupo y un paquete");
                    return;
                  }

                  try {
                    await Api.crearInscripcion({
                      alumno_id: detalle.alumno_id,
                      grupo_id: Number(grupoSeleccionado),
                      paquete_id: Number(paqueteSeleccionado),
                      clase_ids: claseIdsSeleccionadas,
                      fecha_inicio: new Date().toISOString().split("T")[0],
                      dia_pago:
                        alumno.dia_pago_efectivo || alumno.dia_pago || 1,
                    });

                    setShowAgregarInscripcion(false);
                    setGrupoSeleccionado("");
                    setPaqueteSeleccionado("");

                    await cargarDetalle();
                    onActualizar?.();
                    showToast?.("Inscripción agregada correctamente");
                  } catch (e) {
                    alert(e.message || "No se pudo agregar la inscripción");
                  }
                }}
              >
                Guardar
              </button>

              <button
                type="button"
                onClick={() => setShowAgregarInscripcion(false)}
                style={{ marginTop: 10, width: "100%" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
        {inscripcionEditando && (
          <div
            className="overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setInscripcionEditando(null);
                setClaseIdsEditando([]);
              }
            }}
          >
            <div className="drawer" style={{ maxHeight: "70dvh" }}>
              <div className="drawer-handle" />

              <div className="drawer-title">Editar clases</div>

              <div
                style={{
                  fontSize: 12,
                  color: "var(--gr)",
                  marginBottom: 14,
                }}
              >
                {inscripcionEditando.grupo || "Grupo"}
              </div>

              <div className="field">
                <label>Clases asignadas</label>

                {clasesDisponibles
                  .filter(
                    (clase) =>
                      Number(clase.grupo_id) ===
                      Number(inscripcionEditando.grupo_id),
                  )
                  .map((clase) => {
                    const claseId = Number(clase.clase_id || clase.id);
                    const marcada = claseIdsEditando.includes(claseId);

                    return (
                      <label
                        key={claseId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 10px",
                          marginBottom: 8,
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={marcada}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setClaseIdsEditando((prev) => [...prev, claseId]);
                            } else {
                              setClaseIdsEditando((prev) =>
                                prev.filter((id) => id !== claseId),
                              );
                            }
                          }}
                        />

                        <span>
                          {clase.dia_nombre ||
                            clase.dia ||
                            `Día ${clase.dia_semana}`}{" "}
                          {clase.hora_inicio
                            ? `${clase.hora_inicio} - ${clase.hora_fin}`
                            : ""}
                        </span>
                      </label>
                    );
                  })}
              </div>

              <button
                type="button"
                className="btn-save"
                style={{ width: "100%", marginTop: 12 }}
                onClick={async () => {
                  try {
                    await Api.actualizarClasesInscripcion(
                      inscripcionEditando.id,
                      claseIdsEditando,
                    );

                    await cargarDetalle();
                    onActualizar?.();

                    showToast?.("Clases actualizadas correctamente ✓");

                    setInscripcionEditando(null);
                    setClaseIdsEditando([]);
                  } catch (e) {
                    alert(
                      e.message ||
                        "No se pudieron actualizar las clases de la inscripción",
                    );
                  }
                }}
              >
                Guardar clases
              </button>

              <button
                type="button"
                onClick={() => {
                  setInscripcionEditando(null);
                  setClaseIdsEditando([]);
                }}
                style={{ marginTop: 10, width: "100%" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

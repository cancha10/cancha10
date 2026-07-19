export default function AccionesRapidas() {
  return (
    <div
      className="card"
      style={{
        marginBottom: 20,
        padding: 16,
      }}
    >
      <h3 style={{ marginTop: 0 }}>Acciones rápidas</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        <button>👨‍🎓 Nuevo alumno</button>

        <button>💰 Registrar pago</button>

        <button>📅 Ver agenda</button>

        <button>🎾 Tomar asistencia</button>
      </div>
    </div>
  );
}

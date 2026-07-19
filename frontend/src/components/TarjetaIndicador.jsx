export default function TarjetaIndicador({ icono, titulo, valor }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 16,
        textAlign: "center",
        background: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontSize: 30 }}>{icono}</div>

      <div
        style={{
          fontSize: 28,
          fontWeight: "bold",
          marginTop: 8,
          color: "#111",
        }}
      >
        {valor}
      </div>

      <div
        style={{
          marginTop: 6,
          color: "#666",
          fontSize: 14,
        }}
      >
        {titulo}
      </div>
    </div>
  );
}

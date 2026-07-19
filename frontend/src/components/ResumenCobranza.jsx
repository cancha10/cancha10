import TarjetaIndicador from "./TarjetaIndicador";
export default function ResumenCobranza({ estadisticas }) {
  return (
    <div
      className="card"
      style={{
        marginBottom: 12,
        padding: 12,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12,
      }}
    >
      <TarjetaIndicador icono="👥" titulo="Total" valor={estadisticas.total} />

      <TarjetaIndicador
        icono="🟢"
        titulo="Al corriente"
        valor={estadisticas.alCorriente}
      />

      <TarjetaIndicador
        icono="🟡"
        titulo="Vence pronto"
        valor={estadisticas.vencePronto}
      />

      <TarjetaIndicador
        icono="🔴"
        titulo="Atrasados"
        valor={estadisticas.atrasados}
      />

      <TarjetaIndicador
        icono="⚪"
        titulo="Sin pago"
        valor={estadisticas.sinPago}
      />
    </div>
  );
}

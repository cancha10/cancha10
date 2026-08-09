import TarjetaIndicador from "./TarjetaIndicador";

export default function ResumenCobranza({ estadisticas, onFiltro }) {
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
      <div onClick={() => onFiltro("todos")} style={{ cursor: "pointer" }}>
        <TarjetaIndicador
          icono="👥"
          titulo="Total"
          valor={estadisticas.total}
        />
      </div>

      <div
        onClick={() => onFiltro("al_corriente")}
        style={{ cursor: "pointer" }}
      >
        <TarjetaIndicador
          icono="🟢"
          titulo="Al corriente"
          valor={estadisticas.alCorriente}
        />
      </div>

      <div
        onClick={() => onFiltro("vence_pronto")}
        style={{ cursor: "pointer" }}
      >
        <TarjetaIndicador
          icono="🟡"
          titulo="Vence pronto"
          valor={estadisticas.vencePronto}
        />
      </div>

      <div onClick={() => onFiltro("atrasado")} style={{ cursor: "pointer" }}>
        <TarjetaIndicador
          icono="🔴"
          titulo="Atrasados"
          valor={estadisticas.atrasados}
        />
      </div>

      <div onClick={() => onFiltro("sin_pago")} style={{ cursor: "pointer" }}>
        <TarjetaIndicador
          icono="⚪"
          titulo="Sin pago"
          valor={estadisticas.sinPago}
        />
      </div>
    </div>
  );
}

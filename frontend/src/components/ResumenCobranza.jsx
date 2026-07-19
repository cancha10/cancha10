export default function ResumenCobranza({ estadisticas }) {
  return (
    <div className="card" style={{ marginBottom: 12, padding: 12 }}>
      <div>Total: {estadisticas.total}</div>
      <div>Al corriente: {estadisticas.alCorriente}</div>
      <div>Vence pronto: {estadisticas.vencePronto}</div>
      <div>Atrasados: {estadisticas.atrasados}</div>
      <div>Sin pago: {estadisticas.sinPago}</div>
    </div>
  );
}

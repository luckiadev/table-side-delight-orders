
/**
 * Formatea un número como entero con separador de miles y sin decimales, usando punto como separador.
 * Ejemplo: 1500 => "1.500"
 */
export function formatNumber(num: number): string {
  return Math.round(num)
    .toLocaleString('es-CL', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
    .replace(/,/g, '.');
}

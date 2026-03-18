/**
 * Jornada del casino: 9:00 AM → 6:00 AM del día siguiente.
 *
 * Si ahora es antes de las 9 AM, la jornada "actual" es la de ayer
 * (porque estamos en la cola de la jornada anterior).
 */

const HORA_INICIO = 9;  // 9:00 AM
const HORA_FIN = 6;     // 6:00 AM del día siguiente

export interface Jornada {
  inicio: string; // ISO string
  fin: string;    // ISO string
  label: string;  // "Hoy", "Ayer", etc.
}

/** Retorna la jornada actual basada en la hora del momento */
export function getJornadaActual(): Jornada {
  const now = new Date();
  const hora = now.getHours();

  // Antes de las 9 AM → seguimos en la jornada de ayer
  if (hora < HORA_INICIO) {
    const ayer = new Date(now);
    ayer.setDate(ayer.getDate() - 1);
    return buildJornada(ayer, hora < HORA_FIN ? 'Jornada en curso' : 'Jornada anterior');
  }

  // 9 AM en adelante → jornada de hoy
  return buildJornada(now, 'Jornada en curso');
}

/** Retorna la jornada de ayer (útil para el botón "Ayer") */
export function getJornadaAyer(): Jornada {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);

  const ahora = new Date();
  if (ahora.getHours() < HORA_INICIO) {
    // Si estamos antes de las 9 AM, "ayer" sería 2 días atrás
    ayer.setDate(ayer.getDate() - 1);
  }

  return buildJornada(ayer, 'Ayer');
}

/** Retorna inicio y fin de la semana actual (lunes → domingo, con jornadas) */
export function getSemanaActual(): { inicio: string; fin: string; label: string } {
  const now = new Date();
  const dia = now.getDay(); // 0=dom, 1=lun...
  const diffLunes = dia === 0 ? -6 : 1 - dia;

  const lunes = new Date(now);
  lunes.setDate(now.getDate() + diffLunes);
  lunes.setHours(HORA_INICIO, 0, 0, 0);

  const domingoFin = new Date(lunes);
  domingoFin.setDate(lunes.getDate() + 7);
  domingoFin.setHours(HORA_FIN, 0, 0, 0);

  return {
    inicio: lunes.toISOString(),
    fin: domingoFin.toISOString(),
    label: `Semana del ${lunes.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}`,
  };
}

/** Retorna inicio y fin del mes actual */
export function getMesActual(): { inicio: string; fin: string; label: string } {
  const now = new Date();

  const primero = new Date(now.getFullYear(), now.getMonth(), 1, HORA_INICIO, 0, 0);

  const primeroDeSiguiente = new Date(now.getFullYear(), now.getMonth() + 1, 1, HORA_FIN, 0, 0);

  return {
    inicio: primero.toISOString(),
    fin: primeroDeSiguiente.toISOString(),
    label: primero.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }),
  };
}

function buildJornada(dia: Date, label: string): Jornada {
  const inicio = new Date(dia);
  inicio.setHours(HORA_INICIO, 0, 0, 0);

  const fin = new Date(dia);
  fin.setDate(fin.getDate() + 1);
  fin.setHours(HORA_FIN, 0, 0, 0);

  return {
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    label,
  };
}

/** Formatea la jornada para mostrar: "Lun 17 Mar, 09:00 – Mar 18 Mar, 06:00" */
export function formatJornadaRango(inicio: string, fin: string): string {
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
  const i = new Date(inicio).toLocaleString('es-CL', opts);
  const f = new Date(fin).toLocaleString('es-CL', opts);
  return `${i} – ${f}`;
}

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar horario.json
const horario = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "horario.json"), "utf8")
);

// Mapeo de días a números ICS (MO, TU, WE, TH, FR)
const diasICS = {
  "Lunes": "MO",
  "Martes": "TU",
  "Miércoles": "WE",
  "Jueves": "TH",
  "Viernes": "FR"
};

// Convertir hora local Chile → UTC (abril 2026 = GMT-4)
function convertirAUTC(hora) {
  const [h, m] = hora.split(":").map(Number);
  const local = new Date(Date.UTC(2026, 3, 6, h + 4, m)); // +4 para compensar GMT-4
  const hh = String(local.getUTCHours()).padStart(2, "0");
  const mm = String(local.getUTCMinutes()).padStart(2, "0");
  return `${hh}${mm}00Z`;
}

function generarICS() {
  let ics = "";
  ics += "BEGIN:VCALENDAR\n";
  ics += "VERSION:2.0\n";
  ics += "CALSCALE:GREGORIAN\n";
  ics += "METHOD:PUBLISH\n";
  ics += "PRODID:-//Josefapp//Horario//ES\n";

  // Fecha base para el primer lunes del año escolar (ejemplo)
  const fechaBase = {
    "Lunes": "20260406",
    "Martes": "20260407",
    "Miércoles": "20260408",
    "Jueves": "20260409",
    "Viernes": "20260410"
  };

  for (const dia in horario) {
    const bloques = horario[dia];
    const dayCode = diasICS[dia];
    const baseDate = fechaBase[dia];

    bloques.forEach(b => {
      const dtStartUTC = `${baseDate}T${convertirAUTC(b.start)}`;
      const dtEndUTC = `${baseDate}T${convertirAUTC(b.end)}`;

      ics += "BEGIN:VEVENT\n";
      ics += `DTSTART:${dtStartUTC}\n`;
      ics += `DTEND:${dtEndUTC}\n`;
      ics += `SUMMARY:${b.subject}\n`;
      ics += `RRULE:FREQ=WEEKLY;BYDAY=${dayCode}\n`;

      // 🔕 Desactivar alertas
      ics += "BEGIN:VALARM\n";
      ics += "ACTION:NONE\n";
      ics += "END:VALARM\n";

      ics += "END:VEVENT\n";
    });
  }

  ics += "END:VCALENDAR\n";
  return ics;
}

// Convertir a CRLF
const icsContent = generarICS().replace(/\n/g, "\r\n");

// Guardar archivo
fs.writeFileSync("calendario_horario.ics", icsContent, "utf8");

console.log("✅ calendario_horario.ics generado correctamente (UTC + CRLF)");

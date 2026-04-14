import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar calendario y horario
const calendar = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "data.json"), "utf8")).calendar;
const horario = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "horario.json"), "utf8"));

// Convertir fecha a nombre de día
function diaSemana(fecha) {
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return dias[new Date(fecha).getDay()];
}

// Buscar bloque correcto según asignatura
function buscarBloque(fecha, subject) {
    const dia = diaSemana(fecha);
    const bloques = horario[dia];
    if (!bloques) return null;

    return bloques.find(b => b.subject === subject) || null;
}

// Convertir hora local Chile → UTC en formato ICS
function convertirAUTC(fecha, hora) {
    const [h, m] = hora.split(":").map(Number);

    const local = new Date(`${fecha}T${hora}:00-04:00`); // Chile abril 2026 = GMT-4
    const utcYear = local.getUTCFullYear();
    const utcMonth = String(local.getUTCMonth() + 1).padStart(2, "0");
    const utcDay = String(local.getUTCDate()).padStart(2, "0");
    const utcHour = String(local.getUTCHours()).padStart(2, "0");
    const utcMin = String(local.getUTCMinutes()).padStart(2, "0");

    return `${utcYear}${utcMonth}${utcDay}T${utcHour}${utcMin}00Z`;
}

function generarICS() {
    let ics = "";
    ics += "BEGIN:VCALENDAR\n";
    ics += "VERSION:2.0\n";
    ics += "CALSCALE:GREGORIAN\n";
    ics += "METHOD:PUBLISH\n";
    ics += "PRODID:-//Josefapp//ES\n";

    calendar.forEach(ev => {
        ics += "BEGIN:VEVENT\n";

        if (ev.allDay) {
            const date = ev.date.replace(/-/g, "");
            ics += `DTSTART;VALUE=DATE:${date}\n`;
        } else {
            const bloque = buscarBloque(ev.date, ev.subject);

            if (bloque) {
                const dtStartUTC = convertirAUTC(ev.date, bloque.start);
                const dtEndUTC = convertirAUTC(ev.date, bloque.end);

                ics += `DTSTART:${dtStartUTC}\n`;
                ics += `DTEND:${dtEndUTC}\n`;
            } else {
                const date = ev.date.replace(/-/g, "");
                ics += `DTSTART;VALUE=DATE:${date}\n`;
            }
        }

        const cleanDescription = String(ev.description || "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        ics += `SUMMARY:${ev.subject}\n`;
        ics += `DESCRIPTION:${cleanDescription}\n`;

        ics += "END:VEVENT\n";
    });

    ics += "END:VCALENDAR\n";
    return ics;
}

fs.writeFileSync("calendario.ics", generarICS(), "utf8");
console.log("✅ calendario.ics generado en UTC (compatible con Google Calendar Web)");

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

function generarICS() {
    let ics = "";
    ics += "BEGIN:VCALENDAR\n";
    ics += "VERSION:2.0\n";
    ics += "CALSCALE:GREGORIAN\n";
    ics += "METHOD:PUBLISH\n";
    ics += "PRODID:-//Josefapp//ES\n";

    calendar.forEach(ev => {
        const date = ev.date.replace(/-/g, "");

        ics += "BEGIN:VEVENT\n";

        if (ev.allDay) {
            // Evento de día completo
            ics += `DTSTART;VALUE=DATE:${date}\n`;
        } else {
            // Buscar bloque según horario
            const bloque = buscarBloque(ev.date, ev.subject);

            if (bloque) {
                const start = bloque.start.replace(":", "") + "00";
                const end = bloque.end.replace(":", "") + "00";

                // Zona horaria correcta para Chile
                ics += `DTSTART;TZID=America/Santiago:${date}T${start}\n`;
                ics += `DTEND;TZID=America/Santiago:${date}T${end}\n`;
            } else {
                // Si no encuentra bloque, lo deja como all-day
                ics += `DTSTART;VALUE=DATE:${date}\n`;
            }
        }

        const cleanDescription = String(ev.description || "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        ics += `SUMMARY:${ev.subject} – ${cleanDescription}\n`;
        ics += "END:VEVENT\n";
    });

    ics += "END:VCALENDAR\n";
    return ics;
}

fs.writeFileSync("calendario.ics", generarICS(), "utf8");
console.log("✅ calendario.ics generado con horario automático y zona horaria correcta");

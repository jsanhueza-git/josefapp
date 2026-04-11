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
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nPRODID:-//Josefapp//ES\n";

    calendar.forEach(ev => {
        const date = ev.date.replace(/-/g, "");

        ics += "BEGIN:VEVENT\n";

        if (ev.allDay) {
            ics += `DTSTART;VALUE=DATE:${date}\n`;
        } else {
            const bloque = buscarBloque(ev.date, ev.subject);

            if (bloque) {
                const start = bloque.start.replace(":", "") + "00";
                const end = bloque.end.replace(":", "") + "00";
                ics += `DTSTART:${date}T${start}\n`;
                ics += `DTEND:${date}T${end}\n`;
            } else {
                ics += `DTSTART;VALUE=DATE:${date}\n`;
            }
        }

        const cleanDescription = String(ev.description || "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        ics += `SUMMARY:${ev.subject} – ${cleanDescription}\nEND:VEVENT\n`;
    });

    ics += "END:VCALENDAR\n";
    return ics;
}

fs.writeFileSync("calendario.ics", generarICS(), "utf8");
console.log("✅ calendario.ics generado con horario automático");

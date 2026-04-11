import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Necesario para rutas relativas en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer data.json desde la carpeta /data
const raw = fs.readFileSync(path.join(__dirname, "data", "data.json"), "utf8");
const json = JSON.parse(raw);
const events = json.calendar;

function generarICSDesdeJSON(events) {
    let ics = "BEGIN:VCALENDAR\n";
    ics += "VERSION:2.0\n";
    ics += "CALSCALE:GREGORIAN\n";
    ics += "METHOD:PUBLISH\n";
    ics += "PRODID:-//Josefapp//ES\n";

    events.forEach(ev => {
        const date = ev.date.replace(/-/g, "");

        const cleanDescription = String(ev.description || "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        ics += "BEGIN:VEVENT\n";
        ics += `DTSTART;VALUE=DATE:${date}\n`;
        ics += `SUMMARY:${ev.subject} – ${cleanDescription}\n`;
        ics += "END:VEVENT\n";
    });

    ics += "END:VCALENDAR\n";
    return ics;
}

function main() {
    const icsContent = generarICSDesdeJSON(events);
    fs.writeFileSync("calendario.ics", icsContent, "utf8");
    console.log("✅ calendario.ics generado correctamente");
}

main();

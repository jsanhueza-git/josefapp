# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Propósito

Aplicación de calendario escolar para Josefa (2° grado A, Colegio Santa María). Hay dos flujos activos:

1. La generación del archivo `calendario.ics` a partir de los datos en `data/data.json`, para ser suscrito desde iPhone y Google Calendar mediante URL pública de GitHub Pages.
2. **Lectura Veloz** (`lectura/`): práctica de velocidad lectora para Josefa (ver sección al final).

## Comandos

```bash
# Generar calendario.ics localmente (solo para pruebas)
npm run generate-ics

# Generar calendario_horario.ics (no se usa activamente)
npm run generate-ics-horario
```

> **Importante:** `calendario.ics` está en `.gitignore`. **Nunca hacer commit de este archivo.** GitHub Actions lo genera automáticamente con `git add -f` en cada push a `main`. Solo hacer commit de `data/data.json`.

## Flujo de trabajo

1. Editar `data/data.json` → sección `"calendar"` con los nuevos eventos
2. Commit y push de `data/data.json`
3. GitHub Actions (`.github/workflows/generate-ics.yml`) regenera y sube `calendario.ics` automáticamente

Si hay conflicto en `calendario.ics` al hacer pull/rebase, siempre resolver con `git checkout --theirs calendario.ics`.

## Estructura de datos (`data/data.json`)

La sección `"calendar"` acepta dos tipos de entradas:

```json
// Evento de asignatura (usa horario.json para determinar la hora)
{
  "date": "2026-06-08",
  "subject": "Music",
  "description": "Texto descriptivo (puede contener HTML)"
}

// Evento de día completo (feriados, vacaciones, hitos)
{
  "date": "2026-06-22",
  "title": "Inicio Vacaciones de Invierno",
  "allday": true
}
```

Las claves válidas para `subject` son:
`Music`, `Math`, `Spanish`, `EnglishLanguage`, `Art`, `CommunicativeSkills`, `STEM`, `FormacionCiudadana`, `FormacionIntegral`, `NaturalScience`, `SocialStudies`, `Literacy`, `Drama`, `PhysicalEducation`

## Generación del ICS (`generate-ics.mjs`)

- Lee `data/data.json` (sección `calendar`) y `data/horario.json`
- Para eventos con `subject`: busca el bloque horario del día en `horario.json` y convierte de hora local Chile (GMT-4) a UTC
- Para eventos `allday` o sin bloque horario: genera evento `VALUE=DATE`
- El HTML en `description` se limpia (strip de tags) antes de escribir al ICS
- El archivo se escribe con CRLF para compatibilidad con Google Calendar

## Zona horaria

El generador usa offset fijo `GMT-4` (Chile en período sin horario de verano). Si en el futuro hay evaluaciones en período de horario de verano (octubre–marzo), el offset debe ajustarse a `GMT-3` en `generate-ics.mjs`.

## Lectura Veloz (`lectura/`)

Página para que Josefa practique velocidad lectora: muestra un cuento, poema o canción y resalta palabra por palabra a la velocidad elegida en palabras por minuto (ppm). Se abre desde la tarjeta "📖 Lectura Veloz" del inicio. URL pública: `https://jsanhueza-git.github.io/josefapp/lectura/`.

- **Todo está en un solo archivo:** `lectura/index.html` (HTML + CSS + JS, sin dependencias ni build). Esta es la copia oficial; la carpeta antigua `C:\DEV\Velocidad Lectora` ya no se mantiene.
- **Tarjeta del inicio:** entrada en `data/data.json` → `home_items` con `"type": "link"` y `"url": "lectura/"`. El tipo `link` se maneja en `loadHomeItems()` de `script.js`.
- **Textos incluidos en el código:** arreglo `BUILTIN` dentro de `lectura/index.html` (cuentos, poemas, canciones tradicionales y trabalenguas).
- **Textos que se cargan desde la carpeta** (solo con servidor, p. ej. GitHub Pages; no con `file://`): `lectura/cuentos/*.txt`, listados en `lectura/cuentos/lista.json`.

### Agregar un cuento nuevo

1. Crear `lectura/cuentos/<Título>.txt` en UTF-8. Dejar una línea en blanco entre párrafos; en poemas y canciones, un verso por línea.
2. Agregar una entrada a `lectura/cuentos/lista.json`, manteniendo el orden alfabético:
   ```json
   { "archivo": "<Título>.txt", "titulo": "<Título>", "categoria": "cuentos" }
   ```
   `categoria` es opcional (por defecto `cuentos`); valores válidos: `cuentos`, `poemas`, `canciones`, `otros`.
3. Commit y push a `main`.

**Criterios para los textos:** español de Chile, nivel 2° básico, entre 120 y 180 palabras, con diálogos y un mensaje positivo. Usar textos originales, fábulas clásicas contadas con palabras propias o canciones tradicionales de dominio público. **No** incluir letras de canciones ni textos con derechos de autor.

### Comportamiento clave

- Duración de cada palabra = `60000 / ppm` ms, multiplicada en `delayFor()` según el nivel de pausa (`settings.pausa`, de 0 a 3): coma o fin de verso, punto seguido y punto aparte (este último, la pausa más larga).
- Los ajustes y los textos que sube el usuario se guardan en `localStorage` (`lv_settings`, `lv_custom`) del navegador de cada dispositivo; no se sincronizan.
- Diseño de una sola pantalla: lista de textos a la izquierda (en celular, un panel que se abre con "📚 Textos"), lector al centro y controles en una fila abajo. Evitar que la página tenga scroll.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Propósito

Aplicación de calendario escolar para Josefa (2° grado A, Colegio Santa María). El único flujo activo y relevante es la generación del archivo `calendario.ics` a partir de los datos en `data/data.json`, para ser suscrito desde iPhone y Google Calendar mediante URL pública de GitHub Pages.

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

# 🌀 EffectTextureGen v4.0

![Version](https://img.shields.io/badge/version-4.0.0-blueviolet)
![Tech](https://img.shields.io/badge/tech-React_19_%7C_Three.js_%7C_Vite_8-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**EffectTextureGen** es una estación de trabajo profesional basada en el navegador para la generación de texturas procedurales. Diseñada para Artistas Técnicos (Tech Artists), Desarrolladores de Juegos y Diseñadores UI, permite crear activos gráficos complejos mediante algoritmos matemáticos (SDF, Ruido, Fractales) sin necesidad de software de escritorio pesado.

## 🚀 Características Principales

- **Motor de Shaders Híbrido:** Compilación dinámica de fragment shaders GLSL basada en una arquitectura modular de "Chunks".
- **Visualización PBR en Tiempo Real:** Previsualización instantánea con iluminación basada en física (GGX), mapas de normales y desplazamiento.
- **Exportación Versátil:**
  - Mapas estáticos hasta 4K (PNG/JPG/WEBP).
  - **Sprite Sheets** automáticos para VFX de juegos.
  - Grabación de **Video (WebM)** y **GIFs** animados.
  - Exportación de **Código HTML Standalone** y **GLB 3D**.
  - **ZIP** con todos los mapas de material.
- **Gestión de Estado Robusta:** Presets, Historial (Undo/Redo) y persistencia local.
- **Capas y Composición:** Mezcla de patrones procedurales con imágenes importadas.
- **Biblioteca de Patrones:** 8 categorías (abstracto, fuego, gradientes, naturaleza, ruido, SDF, formas, 3D).

## 🛠️ Stack Tecnológico

| Categoría  | Herramienta         | Versión   |
| ---------- | ------------------- | --------- |
| Runtime    | Bun                 | >= 1.2    |
| Framework  | React               | 19.x      |
| Lenguaje   | TypeScript          | 5.8.x     |
| Build      | Vite                | 8.x       |
| Bundler    | Rolldown (via Vite) | integrado |
| Estilos    | Tailwind CSS        | 4.x       |
| 3D         | Three.js + R3F      | 0.182.x   |
| Animación  | GSAP                | 3.12.x    |
| Linting    | oxlint (OXC)        | latest    |
| Formatting | oxfmt (OXC)         | latest    |
| Testing    | Vitest              | 3.x       |

## ⚡ Inicio Rápido

```bash
# Instalar Bun (si no está instalado)
# https://bun.sh/

# Clonar e instalar
git clone <repo-url>
cd texture-genetics
bun install

# Iniciar servidor de desarrollo
bun run dev
```

El servidor se inicia en `http://localhost:3000`.

## 📂 Estructura del Proyecto

```text
src/
├── core/        # Lógica de negocio, tipos, constantes, estado
├── features/    # Componentes UI por funcionalidad
├── lib/         # Motores internos (shaders, geometría, uniforms)
├── shared/      # Código compartido (hooks, UI, utils)
├── data/        # Definiciones de patrones y presets
└── types/       # Declaraciones de tipos adicionales
```

👉 **[Arquitectura detallada](docs/ARCHITECTURE.md)** | **[Guía de desarrollo](docs/DEVELOPMENT.md)**

## 🎮 Controles Rápidos

| Acción                    | Atajo               |
| ------------------------- | ------------------- |
| Rotar cámara              | Click Izquierdo     |
| Zoom                      | Rueda del ratón     |
| Pausar/Reanudar animación | `Espacio`           |
| Aleatorizar parámetros    | `R`                 |
| Deshacer / Rehacer        | `Ctrl+Z` / `Ctrl+Y` |
| Ocultar paneles           | `H`                 |

## 📋 Scripts Disponibles

```bash
bun run dev           # Servidor de desarrollo
bun run build         # Build de producción + logs/build.log
bun run test          # Tests unitarios + logs/test.log
bun run test:coverage # Cobertura + logs/test-coverage.log
bun run lint          # Linting + logs/lint.log
bun run fmt           # Formatear código + logs/format-write.log
bun run typecheck     # Verificar tipos + logs/typecheck.log
bun run check         # Checks combinados + logs/check.log
```

## 🪵 Logs y debugging

Los scripts de validación escriben logs legibles en `logs/` tanto si se ejecutan desde terminal como desde las tareas de VS Code.

- `build` → `logs/build.log`
- `lint` / `lint:fix` → `logs/lint.log` / `logs/lint-fix.log`
- `fmt` / `fmt:check` → `logs/format-write.log` / `logs/format.log`
- `typecheck` → `logs/typecheck.log`
- `test` / `test:coverage` → `logs/test.log` / `logs/test-coverage.log`
- `check` → `logs/check.log`

## 📚 Documentación

- [Arquitectura](docs/ARCHITECTURE.md) — Diagrama, patrones, estructura
- [Desarrollo](docs/DEVELOPMENT.md) — Setup, scripts, herramientas
- [Deuda Técnica](docs/TECHNICAL_DEBT.md) — Issues conocidos y mejoras pendientes
- [Changelog](docs/TASKS_COMPLETED.md) — Historial de cambios v4.0

## 📄 Licencia

MIT

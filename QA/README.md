# QA — Suite de pruebas Playwright (SIGDIM)

## Requisitos previos

- Node.js 18+
- El backend necesita `backend/.env` con `DATABASE_URL`, `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` definidos (no necesita una base de datos alcanzable: ninguna ruta actual toca Prisma).
- **Instalación de dependencias**: antes de correr la suite, instala las dependencias en la raíz del repo y en `backend/`, ya que los servidores se lanzan automáticamente vía `webServer`:
  ```bash
  npm install           # en la raíz
  cd backend && npm install   # en backend/
  ```

## Instalación

```bash
cd QA
npm install
npx playwright install chromium
```

## Ejecutar la suite

```bash
npm test              # corre todos los specs (levanta frontend y backend automáticamente)
npm run test:ui       # modo interactivo (UI mode) de Playwright
npm run report        # abre el último reporte HTML generado
```

Los servidores de frontend (`http://localhost:5173`) y backend (`http://localhost:3000`) se levantan automáticamente vía `webServer` en `playwright.config.ts`, reutilizando instancias ya corriendo si existen.

## Estructura

```
QA/
  tests/
    helpers/auth.ts     # login como abogado o solicitante
    ui/                 # un spec por pantalla del frontend
    api/                # specs contra el backend real (health, 404)
  REPORTE_HALLAZGOS.md  # estado de cada pantalla y riesgos para producción
```

## Convención de los tests

- Los tests marcados `no-op:` confirman explícitamente que un botón decorativo no hace nada — son parte deliberada de la cobertura, no fallos.
- Los tests marcados `BUG:` o `hallazgo:` documentan defectos o gaps reales del sistema. Están escritos para pasar hoy (afirman el comportamiento actual); si alguien corrige el defecto correspondiente, ese test empezará a fallar como señal de que el reporte de hallazgos debe actualizarse.
- Los tests marcados `real:` confirman que una funcionalidad sí está conectada de extremo a extremo (navegación, tabs, acordeones, filtros, descarga de PDF, etc.), en contraste con los `no-op:`.

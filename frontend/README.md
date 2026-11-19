# Ilqaa frontend

React 19 + Vite + Tailwind app (originally ILQAA-LAB, built in Google AI Studio).

All server-side work – the AI practice tasks (`/api/analyze`), text-to-speech
(`/api/tts`) and the live coaching WebSockets – is served by the FastAPI backend
in [`../backend`](../backend). The frontend has no server of its own and needs
no API keys.

## Run locally

1. Start the backend on port 8000 (see the root README).
2. Install and start the frontend:

   ```bash
   npm install
   ```

   ```bash
   npm run dev
   ```

3. Open <http://localhost:3000>. The Vite dev server forwards `/api` and `/ws`
   to the backend (`BACKEND_URL`, default `http://localhost:8000`).

## Build

```bash
npm run build
```

The static site is written to `dist/`. In production it must be served from the
same origin as the backend's `/api`, or behind a proxy/rewrite that forwards
`/api` to it.

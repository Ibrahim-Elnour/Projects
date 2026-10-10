# Vigil

A campus-safety reporting interface for The Ohio State University. The React frontend runs in demo mode with browser storage by default; set `VITE_API_URL` to connect it to a Flask API.

## Run locally

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env` to configure the API base URL. The frontend expects `GET/POST /api/reports`, `GET/POST /api/chat/messages`, `GET /api/notifications`, and `POST /api/notifications/read`. API responses are JSON; report creation returns the created report, and chat creation returns the new message.

The demo map uses OpenStreetMap tiles, darkened in the interface. Internet access is required for map tiles.

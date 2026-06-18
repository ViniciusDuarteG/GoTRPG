# GoTRPG

Sistema de fichas de RPG com frontend React e backend Python.

## Rodar

Backend:

```bash
cd backend
python3 main.py
```

API: `http://127.0.0.1:8001`

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`.

## Docker VPS

```bash
cp .env.example .env
docker compose up -d --build
```

Abra `http://SEU_IP:38473`.

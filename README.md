# CampusPath — deployment-ready campus route finder

CampusPath is a React + Flask application that models campus places as graph nodes and direct walkways as edges. Its Python backend uses Breadth-First Search (BFS) to calculate a route with the fewest edges in the unweighted graph and returns a trace used by the frontend algorithm visualizer.

## What's improved

- Public-hosting-ready API configuration: no production request points to `localhost`.
- Flask health endpoint, request validation, configurable CORS, and Gunicorn production server.
- BFS returns the actual queue, visited nodes, current node, explored connections, and a message for each step.
- Interactive visualizer with play, pause, next, previous, replay, speed control, and a clickable timeline.
- Responsive dashboard, live API status, clearer route results, accessible controls, and reduced-motion support.
- Automated Python unit and API tests.

## Project structure

```text
CampusPath_Deployable/
├── backend/
│   ├── app.py
│   ├── bfs.py
│   ├── graph.py
│   ├── requirements.txt
│   ├── test_bfs.py
│   └── test_api.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   └── vercel.json
└── render.yaml
```

## Deploy the app to the public internet

The app uses two services: a static React frontend on Vercel and a Flask API on Render. This is a conventional way to host this frontend/backend split. You will need GitHub, Vercel, and Render accounts. I cannot publish it under your accounts without access to those accounts, but the repository is configured for this deployment flow.

### 1. Upload this project to GitHub

1. Extract this ZIP.
2. Create a new GitHub repository, for example `campuspath`.
3. Upload/push the contents of this project to the repository's `main` branch. Keep `backend/`, `frontend/`, and `render.yaml` at the repository root.

### 2. Deploy the Flask API on Render

1. In Render, choose **New → Blueprint** and connect your GitHub repository. Render will read the included `render.yaml`.
2. The blueprint creates `campuspath-api`. `rootDir` is already set to `backend`.
3. When asked for `CORS_ORIGINS`, you can initially use `*` to test, or set it to the exact Vercel site origin after the frontend is deployed (recommended), e.g. `https://campuspath.vercel.app`.
4. Wait for the service to deploy. Copy its public URL, for example `https://campuspath-api.onrender.com`.
5. Open `https://YOUR-API-URL/health`. You should get `{"service":"campuspath-api","status":"ok"}`.

If you create the service manually instead of using the Blueprint, use:

- Runtime: Python
- Root Directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn app:app`
- Health check path: `/health`

### 3. Deploy the React website on Vercel

1. In Vercel, choose **Add New → Project** and import the same GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
4. Add environment variable:

   - Name: `VITE_API_BASE_URL`
   - Value: your Render API URL, e.g. `https://campuspath-api.onrender.com` (no trailing slash)

5. Deploy. Vercel gives the website a public `https://...vercel.app` address.
6. Copy the exact website origin and set `CORS_ORIGINS` on Render to that origin. Save and redeploy the Render service.
7. Redeploy the Vercel frontend if you change its environment variable. Vite environment variables are embedded at build time.

### 4. Verify the public website

- Open the Vercel URL in a private/incognito browser window.
- The header should show **API connected**.
- Check `/health` on the Render URL.
- Select Main Gate → Library. The expected route is `Main Gate → Administrative Block → Library` with 2 edges.
- Play the BFS visualizer and confirm the queue and visited nodes change.
- Refresh the page and confirm the dashboard still loads.

## Local development (optional)

The project still supports local development. In development only, the frontend defaults to `http://127.0.0.1:5000` if `VITE_API_BASE_URL` is not set.

Backend terminal:

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Frontend terminal:

```bash
cd frontend
npm ci
npm run dev
```

## Tests and production build

Backend tests (from `backend/`):

```bash
python -m unittest -v
```

Frontend checks (from `frontend/`):

```bash
npm ci
npm run lint
npm run build
```

## API

- `GET /` — API information
- `GET /health` — service health check
- `GET /locations` — campus locations
- `POST /find-route` — shortest path and BFS trace

Request:

```json
{
  "start": "Main Gate",
  "destination": "Library"
}
```

The graph is unweighted. BFS minimizes the number of graph edges, not measured walking distance or time. The campus graph and SVG layout are demonstration data and should be verified against the real campus before being used for actual navigation.

## Hosting notes

- Render's free web services may spin down after 15 minutes without traffic and may take about a minute to wake on the next request. That is a hosting-plan limitation, not a localhost dependency.
- Do not commit secrets or local `.env` files. `VITE_API_BASE_URL` is a public URL, not a secret.
- For a custom domain, add the domain in Vercel and add that exact HTTPS origin to Render's `CORS_ORIGINS`.

# app-web

React frontend for Bolso em Dia.

## Stack

- React 18
- TypeScript
- Vite
- React Router
- React Hook Form
- Zod
- Vitest + Testing Library
- ESLint + Stylelint + Prettier

## Prerequisites

For manual local execution:

- Node.js 22
- npm 10+
- a reachable `app-api` instance

## Ports and API integration

- Vite development server: `http://localhost:5173`
- local preview build: `http://localhost:4173`
- root `docker compose` stack: `http://localhost:4173`

The application resolves the API base URL in this order:

- runtime container config through `window.__APP_CONFIG__.apiBaseUrl`
- development/build fallback through `VITE_API_BASE_URL`
- final local fallback: `http://localhost:8080`

That means:

- in local Vite development, you can still use `VITE_API_BASE_URL`
- in the published Docker image, the runtime container should provide `API_BASE_URL`

## Manual execution

Install dependencies:

```bash
cd app-web
npm ci
```

Start the development server pointing to the local API:

```bash
cd app-web
VITE_API_BASE_URL=http://localhost:8081 npm run dev
```

If the API is running manually on port `8080`, this also works:

```bash
cd app-web
npm run dev
```

Open:

- `http://localhost:5173`

## Build and local preview

Build the app:

```bash
cd app-web
npm run build
```

Serve the production build locally:

```bash
cd app-web
npm run preview
```

Open:

- `http://localhost:4173`

## Running with Docker Compose

Start the integrated stack from the repository root:

```bash
docker compose up --build
```

In this mode:

- `app-web` is served at `http://localhost:4173`
- the container entrypoint generates `app-config.js` with `API_BASE_URL=http://localhost:8081`
- the browser talks to the API through the compose host port, not the internal
  container port

### Example `app-web` compose service

```yaml
services:
  app-web:
    build:
      context: ./app-web
    environment:
      API_BASE_URL: http://localhost:8081
    ports:
      - "4173:80"
    depends_on:
      - app-api
```

### Example full stack

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: bolso_em_dia
      POSTGRES_USER: bolso_em_dia
      POSTGRES_PASSWORD: bolso_em_dia
    ports:
      - "5432:5432"

  app-api:
    build:
      context: ./app-api
    environment:
      DB_URL: jdbc:postgresql://postgres:5432/bolso_em_dia
      DB_USERNAME: bolso_em_dia
      DB_PASSWORD: bolso_em_dia
      APP_ALLOWED_ORIGINS: http://localhost:4173
      APP_ADMIN_EMAIL: admin@bolso-em-dia.local
      APP_ADMIN_PASSWORD: admin123456
      APP_JWT_SECRET: change-this-secret-change-this-secret
    ports:
      - "8081:8080"
    depends_on:
      - postgres

  app-web:
    build:
      context: ./app-web
    environment:
      API_BASE_URL: http://localhost:8081
    ports:
      - "4173:80"
    depends_on:
      - app-api
```


## Docker releases

- workflow: `.github/workflows/docker.yml`
- release and tagging guide: `DOCKER.md`

## Useful commands

```bash
cd app-web
npm run test
npm run lint
npm run typecheck
npm run stylelint
npm run build
```

## Backend dependency

The frontend does not start the database or the API on its own.

When running `app-web` in isolation, make sure `app-api` is reachable from the
browser. For local Vite development, set `VITE_API_BASE_URL` if needed. For the
Docker image, pass `API_BASE_URL` when starting the container.

## Development credentials

When the API is using the default bootstrap data:

- email: `admin@bolso-em-dia.local`
- password: `admin123456`

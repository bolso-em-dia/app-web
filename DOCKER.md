# Docker Usage

This image is published on Docker Hub as:

- `<dockerhub-namespace>/bolso-em-dia-ui`

## Pull

```bash
docker pull <dockerhub-namespace>/bolso-em-dia-ui:latest
```

## Runtime API Configuration

The image reads the API base URL at runtime from:

- `API_BASE_URL`

Example:

- `https://api.example.com`

If `API_BASE_URL` is not provided, the container falls back to:

- `http://localhost:8080`

## Run

```bash
docker run --rm \
  -p 4173:80 \
  -e API_BASE_URL=https://api.example.com \
  <dockerhub-namespace>/bolso-em-dia-ui:latest
```

The container always listens on port `80` internally. The published host port
is configurable.

Example with a custom published port:

```bash
docker run --rm \
  -p 14173:80 \
  -e API_BASE_URL=http://localhost:18081 \
  <dockerhub-namespace>/bolso-em-dia-ui:latest
```

## Health Check

The image publishes its own Docker health check against:

- `http://localhost:80/`

## Source Repository

- GitHub repository: [github.com/bolso-em-dia/app-web](https://github.com/bolso-em-dia/app-web)

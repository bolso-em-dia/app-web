FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts eslint.config.js ./
COPY index.html ./
COPY public ./public
COPY src ./src

RUN npm ci
RUN npm run build

FROM nginx:1.27-alpine
RUN apk add --no-cache curl gettext
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/app-config.js.template /etc/bolso-em-dia/app-config.js.template
COPY docker/entrypoint.sh /entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=10 \
  CMD curl -fsS http://localhost:80/ || exit 1

ENTRYPOINT ["/entrypoint.sh"]

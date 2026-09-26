# Build the static pages with Bun, then serve them with unprivileged nginx on :8080.
FROM oven/bun:1.4-alpine AS build
WORKDIR /src
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY content content
COPY src src
RUN bun run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist/ /usr/share/nginx/html/
EXPOSE 8080

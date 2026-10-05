# syntax=docker/dockerfile:1
# Build context: the repo root (the image needs `shared` and the workspace lockfile).
#   docker build -f frontend/Dockerfile .
# Vite build served by nginx; nginx proxies /api to $API_UPSTREAM.

FROM node:24-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

# Package manifests only, so the install layer is rebuilt on dependency changes, not on code edits
FROM base AS manifests
COPY . /src
RUN cd /src && mkdir /out && cp pnpm-lock.yaml pnpm-workspace.yaml package.json /out/ \
 && find . -name package.json -not -path '*/node_modules/*' -mindepth 2 \
    | while read -r f; do mkdir -p "/out/$(dirname "$f")" && cp "$f" "/out/$f"; done

FROM base AS build
COPY --from=manifests /out .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store --filter frontend...
COPY . .
RUN pnpm --filter frontend... build

FROM nginx:1.29-alpine
# substitute only our variables, never nginx's own ($host, $uri…)
ENV NGINX_ENVSUBST_FILTER=^API_ API_UPSTREAM=api:3000
COPY frontend/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /repo/frontend/dist /usr/share/nginx/html

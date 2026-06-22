# Stage "deps", based on Bun, with only the installed node_modules. Local dev
# targets this stage and runs the Vite dev server against bind-mounted source.
FROM oven/bun:1 AS deps

WORKDIR /app

COPY package.json bun.lock /app/

COPY frontend/package.json /app/frontend/

WORKDIR /app/frontend

RUN bun install

# Stage "build-stage", adds the source and compiles the production bundle.
FROM deps AS build-stage

COPY ./frontend /app/frontend
ARG VITE_API_URL

RUN bun run build


# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:1

COPY --from=build-stage /app/frontend/dist/ /usr/share/nginx/html

COPY ./frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./frontend/nginx-backend-not-found.conf /etc/nginx/extra-conf.d/backend-not-found.conf

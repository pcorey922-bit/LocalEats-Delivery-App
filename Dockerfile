FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN npm install --global pnpm@11.25.0
COPY . .
RUN pnpm install --frozen-lockfile
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_API_ORIGIN
ARG VITE_CLERK_PROXY_URL
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_GOOGLE_MAPS_MAP_ID
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY VITE_API_ORIGIN=$VITE_API_ORIGIN VITE_CLERK_PROXY_URL=$VITE_CLERK_PROXY_URL
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY VITE_GOOGLE_MAPS_MAP_ID=$VITE_GOOGLE_MAPS_MAP_ID
RUN pnpm build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /usr/local/lib/node_modules/pnpm /usr/local/lib/node_modules/pnpm
RUN ln -s /usr/local/lib/node_modules/pnpm/bin/pnpm.cjs /usr/local/bin/pnpm
COPY --from=build --chown=node:node /app /app
ENV NODE_ENV=production PORT=3001 PAYMENT_PROVIDER=disabled WEB_DIST_DIR=/app/artifacts/localeats/dist/public
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD node -e "fetch('http://localhost:3001/livez').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","--enable-source-maps","artifacts/api-server/dist/index.mjs"]

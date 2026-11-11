# Smart Schools in one container: the website at "/", the student area and the Telegram Mini App at "/app/", the teacher portal,
# the API and the Telegram bot.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Only needed when the Mini App is hosted on a different origin than this server.
ARG VITE_API_BASE=
ENV VITE_API_BASE=$VITE_API_BASE
# The Mini App, the server, and the website in ./website (landing page, teacher portal, student play page).
RUN npm run build:all && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8787
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/dist-site ./dist-site
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=4s CMD wget -qO- http://127.0.0.1:${PORT}/api/health || exit 1
CMD ["node", "dist-server/index.js"]

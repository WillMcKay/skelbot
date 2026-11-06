FROM node:24-slim AS ui

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY src/frontend ./src/frontend
RUN npm run build

FROM node:24-slim

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY index.js ./
COPY src/backend ./src/backend
COPY --from=ui /app/src/frontend/dist ./src/frontend/dist

RUN mkdir -p /home/node/.minecraft /app/data && chown node:node /home/node/.minecraft /app/data
VOLUME /home/node/.minecraft

USER node

ENV UI_HOST=0.0.0.0
EXPOSE 3000

STOPSIGNAL SIGINT

CMD ["node", "index.js"]

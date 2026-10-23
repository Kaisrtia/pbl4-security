FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig.base.json ./
COPY shared/ ./shared/
COPY god-view/server/ ./god-view/server/
COPY god-view/client/ ./god-view/client/

RUN npm install
RUN npm run build --workspace=shared
RUN npm run build --workspace=god-view/client
RUN npm run build --workspace=god-view/server

EXPOSE 4000
EXPOSE 5173
CMD ["npm", "run", "start", "--workspace=god-view/server"]

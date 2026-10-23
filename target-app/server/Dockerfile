FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig.base.json ./
COPY shared/ ./shared/
COPY target-app/server/ ./target-app/server/

RUN npm install
RUN npm run build --workspace=shared
RUN npm run build --workspace=target-app/server

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=target-app/server"]

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig.base.json ./
COPY shared/ ./shared/
COPY attacker-controller/ ./attacker-controller/

RUN npm install
RUN npm run build --workspace=shared
RUN npm run build --workspace=attacker-controller

EXPOSE 5000
CMD ["npm", "run", "start", "--workspace=attacker-controller"]

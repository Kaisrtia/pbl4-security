FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 scapy libpcap
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/target-app/server/package.json ./apps/target-app/server/
COPY apps/target-app/client/package.json ./apps/target-app/client/
COPY apps/god-view/server/package.json ./apps/god-view/server/
COPY apps/god-view/client/package.json ./apps/god-view/client/
COPY attacker/package.json ./attacker/
RUN npm ci --workspace=@pbl4/shared --workspace=@pbl4/attacker-controller
COPY packages/shared/ ./packages/shared/
COPY attacker/ ./attacker/
RUN npm run build --workspace=@pbl4/shared \
    && npm run build --workspace=@pbl4/attacker-controller
EXPOSE 5000
CMD ["npm", "run", "start", "--workspace=@pbl4/attacker-controller"]

FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/target-app/server/package.json ./apps/target-app/server/
COPY apps/target-app/client/package.json ./apps/target-app/client/
COPY apps/god-view/server/package.json ./apps/god-view/server/
COPY apps/god-view/client/package.json ./apps/god-view/client/
COPY attacker/package.json ./attacker/
RUN npm ci --workspace=@pbl4/shared --workspace=@pbl4/godview-server --workspace=@pbl4/godview-client
COPY packages/shared/ ./packages/shared/
COPY apps/god-view/ ./apps/god-view/
RUN npm run build --workspace=@pbl4/shared \
    && npm run build --workspace=@pbl4/godview-client \
    && npm run build --workspace=@pbl4/godview-server
EXPOSE 4000
CMD ["npm", "run", "start", "--workspace=@pbl4/godview-server"]

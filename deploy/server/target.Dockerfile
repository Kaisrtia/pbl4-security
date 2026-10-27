FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache --virtual .build-deps python3 make g++
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/target-app/server/package.json ./apps/target-app/server/
COPY apps/target-app/client/package.json ./apps/target-app/client/
COPY apps/god-view/server/package.json ./apps/god-view/server/
COPY apps/god-view/client/package.json ./apps/god-view/client/
COPY attacker/package.json ./attacker/
RUN npm ci --workspace=@pbl4/shared --workspace=@pbl4/target-server --workspace=@pbl4/target-client \
    && apk del .build-deps
COPY packages/shared/ ./packages/shared/
COPY apps/target-app/ ./apps/target-app/
RUN npm run build --workspace=@pbl4/shared \
    && npm run build --workspace=@pbl4/target-client \
    && npm run build --workspace=@pbl4/target-server
EXPOSE 8080
CMD ["npm", "run", "start", "--workspace=@pbl4/target-server"]

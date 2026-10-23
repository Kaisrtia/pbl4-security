FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig.base.json ./
COPY target-app/client/ ./target-app/client/

# Simple static server using npx serve or node
EXPOSE 3000
CMD ["npx", "serve", "target-app/client", "-p", "3000"]

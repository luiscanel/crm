FROM node:18-alpine

WORKDIR /app

# Instalar dependencias de build para better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./

# Instalar solo producción
RUN npm install --only=production

COPY src ./src

EXPOSE 3001

CMD ["node", "src/index.js"]
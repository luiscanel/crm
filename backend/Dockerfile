FROM node:18-alpine

WORKDIR /app

# Instalar dependencias de build para sql.js
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install --production

COPY src ./src

EXPOSE 3001

CMD ["node", "src/index.js"]
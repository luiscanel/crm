FROM node:18-alpine

WORKDIR /app

# Instalar dependencias de build para sql.js
RUN apk add --no-cache python3 make g++

COPY package*.json ./

# Install ALL dependencies (including dev) for testing
RUN npm install

COPY src ./src

# Copy tests for CI
COPY jest.config.js ./
COPY __tests__/ ./

EXPOSE 3001

CMD ["node", "src/index.js"]
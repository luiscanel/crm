FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY index.html ./
COPY src ./src
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY vite.config.js ./

# Set API URL at build time
ENV VITE_API_URL=http://backend:3001/api

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]
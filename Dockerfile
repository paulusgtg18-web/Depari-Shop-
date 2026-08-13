FROM node:18-alpine

WORKDIR /app

# Diperlukan untuk build better-sqlite3 (native module)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p uploads

EXPOSE 3000
CMD ["node", "server.js"]

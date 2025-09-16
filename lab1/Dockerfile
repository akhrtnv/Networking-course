FROM node:18-alpine

WORKDIR /app

COPY index.html ./
COPY styles ./styles
COPY src ./src
COPY server.mjs ./
COPY package.json ./
COPY tests ./tests

EXPOSE 8080

CMD ["node", "server.mjs"]
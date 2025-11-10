FROM node:18-alpine

RUN apk add --no-cache mariadb-client

WORKDIR /usr/src/app

COPY app/package.json ./
RUN npm install --production

COPY app/index.js ./
COPY front/index.html ./public/index.html
COPY front/main.js ./public/main.js

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "index.js"]

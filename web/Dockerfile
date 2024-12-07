FROM node:20.16.0-alpine3.20

RUN addgroup -S web && adduser -S -D web web && \
    mkdir -p /home/web/app && \
    chown -R web:web /home/web/app

USER web
WORKDIR "/home/web/app"
COPY ./package.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start"]
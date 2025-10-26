FROM node:22.19.0-alpine

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
FROM node:8.11.4-alpine
WORKDIR /home/node/app
COPY ./app/package.json /home/node/app/package.json
RUN apk add --no-cache --virtual .gyp \
    autoconf \
    automake \
    g++ \
    libpng-dev \
    libtool \
    make \
    nasm \
    python \
    git && \
    npm i && npm rebuild --build-from-source && \
    apk del .gyp
RUN apk add --no-cache su-exec
COPY ./app /home/node/app
COPY ./entrypoint.sh /home/node/app/entrypoint.sh
RUN chmod +x /home/node/app/entrypoint.sh
ENTRYPOINT ["/home/node/app/entrypoint.sh"]

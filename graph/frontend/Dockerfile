FROM node:latest
WORKDIR /code
COPY next.config.js package.json package-lock.json ./
RUN npm install
COPY pages/ ./pages
COPY src/ ./src
RUN npm run build && npm run export

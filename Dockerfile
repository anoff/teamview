FROM node:18-buster-slim
WORKDIR /app
COPY . .
RUN npm install --quiet && cd userscript/ && npm install --quiet
RUN cd userscript/ && npm run build && cd .. && \
  npm run apidoc
FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ARG DEV_PORT=5173
ENV PORT=${DEV_PORT}
EXPOSE ${DEV_PORT}

CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0 --port ${PORT:-5173}"]

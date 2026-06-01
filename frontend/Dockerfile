FROM node:20-bullseye-slim

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]

FROM node:20-bullseye-slim

WORKDIR /app

COPY frontend-employee/package*.json ./
RUN npm ci

COPY frontend-employee/ ./

ENV HOST=0.0.0.0
ENV PORT=3001

EXPOSE 3001

CMD ["npm", "start"]

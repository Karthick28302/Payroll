FROM node:20-bullseye-slim

WORKDIR /app

COPY frontend-employee/backend/package*.json ./
RUN npm ci

COPY frontend-employee/backend/ ./

ENV HOST=0.0.0.0
ENV PORT=5001

EXPOSE 5001

CMD ["npm", "start"]

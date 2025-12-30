FROM node:18-alpine

WORKDIR /app

# Install PostgreSQL client
RUN apk add --no-cache postgresql-client

# Copy backend files
COPY backend/package*.json ./
RUN npm install

COPY backend/ ./

EXPOSE 3000

CMD ["node", "api.js"]

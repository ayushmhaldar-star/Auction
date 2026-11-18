FROM node:20-alpine

WORKDIR /app

# Copy root and subpackage definitions
COPY package.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm run install:all

# Copy entire source code
COPY . .

# Build frontend production bundle
RUN npm run build

# Expose server port
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["npm", "start"]

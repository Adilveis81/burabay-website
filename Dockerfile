FROM node:18-alpine
WORKDIR /app

# Install dependencies first to leverage Docker layer cache
COPY package.json package-lock.json* ./
RUN npm install --production --silent

COPY . .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]

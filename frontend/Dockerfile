# Use Node.js for Development
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose the port Vite runs on
EXPOSE 5173

# Start Vite
CMD ["npm", "run", "dev", "--", "--host"]
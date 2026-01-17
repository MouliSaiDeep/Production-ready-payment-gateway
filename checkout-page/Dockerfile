FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies using --legacy-peer-deps to ignore conflicts
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Expose the port Vite runs on
EXPOSE 5173

# Start Vite
CMD ["npm", "run", "dev", "--", "--host"]
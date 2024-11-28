# Use Node.js LTS version
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port and start the server
EXPOSE 8080
CMD ["node", "index.js"]

FROM node:22

# Install build tools for native modules like sharp
RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  && rm -rf /var/lib/apt/lists/*

# Set app directory
WORKDIR /usr/src/app

# Copy and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY . .

# Expose the app port
EXPOSE 8080

# Run the service
CMD ["npm", "start"]

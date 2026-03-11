# Step 1: Use an official Node.js image
FROM node:20-slim

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Step 4: Copy the rest of your game code
COPY . .

# Step 5: Build the app (AI Studio apps usually need this)
RUN npm run build

# Step 6: Start the game
# (Note: Change 'start' to 'dev' if your package.json uses dev)
CMD ["npm", "start"]

# Step 7: Expose the port (Cloud Run defaults to 8080)
EXPOSE 8080
ENV PORT 8080

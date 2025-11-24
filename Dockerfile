# Multi-stage Dockerfile for ESIMEDIA full-stack app

# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy package.json and package-lock.json (if available)
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY frontend/ ./

# Build the frontend
RUN npm run build

# Stage 2: Build the Spring Boot backend
FROM maven:3.9.4-eclipse-temurin-17 AS backend-build

WORKDIR /app

# Copy the backend source
COPY esimedia/ ./esimedia/

# Copy the built frontend to the backend's static resources
COPY --from=frontend-build /app/frontend/build/* ./esimedia/src/main/resources/static/

# Build the backend
WORKDIR /app/esimedia
RUN mvn clean package -DskipTests

# Stage 3: Run the application
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy the built JAR from the backend build stage
COPY --from=backend-build /app/esimedia/target/*.jar app.jar

# Expose the port the app runs on
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "app.jar"]
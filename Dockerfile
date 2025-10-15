#build React frontend
FROM node:24-alpine AS frontend-build
WORKDIR /app/frontend

#copy frontend package files
COPY ./frontend/package*.json ./
RUN npm ci

#copy frontend source and build
COPY ./frontend ./
RUN npm run build:prod

#build Spring Boot Backend
FROM maven:3.9-eclipse-temurin-17 AS backend-build
WORKDIR /app

#copy pom.xml and download dependencies
COPY ./backend/pom.xml ./
RUN mvn dependency:go-offline -B

#copy backend source
COPY ./backend/src ./src

#copy react build to Spring Boot static folder
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static

#copy public assets to static folder
COPY --from=frontend-build /app/frontend/public ./src/main/resources/static

#build Spring Boot with embedded frontend
RUN mvn clean package -DskipTests

#runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

#create logs directory
RUN mkdir -p /var/log/quick-share

#copy jar from build stage
COPY --from=backend-build /app/target/*.jar app.jar

#expose ports
EXPOSE 8080 9092

#run application
ENTRYPOINT ["java", "-jar", "app.jar"]

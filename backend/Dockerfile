# ── Stage 1: Build ──
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# ── Stage 2: Run ──
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Add non-root user for security
RUN addgroup -S hospital && adduser -S hospital -G hospital

COPY --from=build /app/target/*.jar app.jar

# Switch to non-root user
USER hospital

EXPOSE 8080

# Use prod profile by default, allow override via env
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xmx512m -Xms256m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

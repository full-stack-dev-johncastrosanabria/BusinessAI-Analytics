# SonarQube Quality Gates

This document defines the quality gate thresholds enforced across all modules of the BusinessAI Analytics Platform.

## Quality Gate: BusinessAI Default

### Thresholds

| Metric                        | Threshold | Scope        |
|-------------------------------|-----------|--------------|
| Security Rating               | A         | All modules  |
| Maintainability Rating        | A         | All modules  |
| Reliability Rating            | A         | All modules  |
| Line Coverage                 | >= 80%    | All modules  |
| Duplicated Lines Density      | <= 3%     | All modules  |
| New Blocker Issues            | 0         | New code     |
| New Critical Issues           | 0         | New code     |
| New Security Hotspots Reviewed| 100%      | New code     |

### Rating Definitions

- **Security Rating A**: No open vulnerabilities
- **Maintainability Rating A**: Technical debt ratio <= 5% (time to fix code smells vs. total development time)
- **Reliability Rating A**: No open bugs

## Module Configuration

| Module            | Language       | Coverage Report Path                        |
|-------------------|----------------|---------------------------------------------|
| Frontend          | TypeScript     | `frontend/coverage/lcov.info`               |
| AI Service        | Python         | `ai-service/coverage.xml`                   |
| API Gateway       | Java 17        | `api-gateway/target/site/jacoco/jacoco.xml` |
| Analytics Service | Java 17        | `analytics-service/target/site/jacoco/jacoco.xml` |
| Customer Service  | Java 17        | `customer-service/target/site/jacoco/jacoco.xml`  |
| Product Service   | Java 17        | `product-service/target/site/jacoco/jacoco.xml`   |
| Sales Service     | Java 17        | `sales-service/target/site/jacoco/jacoco.xml`     |
| Document Service  | Java 17        | `document-service/target/site/jacoco/jacoco.xml`  |

## CI/CD Integration

Analysis is triggered automatically via GitHub Actions (`.github/workflows/sonarqube.yml`) on:
- Push to `main`, `develop`, `feature/**`, `fix/**` branches
- Pull request events (opened, synchronize, reopened)

### Required GitHub Secrets

| Secret            | Description                              |
|-------------------|------------------------------------------|
| `SONAR_TOKEN`     | SonarQube authentication token          |
| `SONAR_HOST_URL`  | SonarQube server URL (e.g. `http://localhost:9000`) |

## Running Analysis Locally

### All modules (from repo root)
```bash
sonar-scanner
```

### Single Java service
```bash
cd <service-directory>
mvn verify sonar:sonar \
  -Dsonar.host.url=$SONAR_HOST_URL \
  -Dsonar.token=$SONAR_TOKEN
```

### Frontend
```bash
cd frontend
npx vitest run --coverage
sonar-scanner \
  -Dsonar.host.url=$SONAR_HOST_URL \
  -Dsonar.token=$SONAR_TOKEN
```

### AI Service
```bash
cd ai-service
pytest --cov=. --cov-report=xml
sonar-scanner \
  -Dsonar.host.url=$SONAR_HOST_URL \
  -Dsonar.token=$SONAR_TOKEN
```

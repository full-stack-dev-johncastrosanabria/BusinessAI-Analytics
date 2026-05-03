# SonarQube Coverage Integration

## Overview

This document describes the SonarQube integration for coverage reporting across all services in the BusinessAI Analytics Platform.

## Configuration Status

### ✅ Completed

The `sonar-project.properties` file has been configured with correct coverage report paths for all services:

| Service | Language | Coverage Report Path | Status |
|---------|----------|---------------------|--------|
| ai-service | Python | `coverage.xml` | ✅ Configured |
| frontend | TypeScript/React | `coverage/lcov.info` | ✅ Configured |
| api-gateway | Java | `target/site/jacoco/jacoco.xml` | ✅ Configured |
| product-service | Java | `target/site/jacoco/jacoco.xml` | ✅ Configured |
| customer-service | Java | `target/site/jacoco/jacoco.xml` | ✅ Configured |
| sales-service | Java | `target/site/jacoco/jacoco.xml` | ✅ Configured |
| analytics-service | Java | `target/site/jacoco/jacoco.xml` | ✅ Configured |
| document-service | Java | `target/site/jacoco/jacoco.xml` | ✅ Configured |

## Configuration Details

### AI Service (Python)

```properties
ai-service.sonar.python.coverage.reportPaths=coverage.xml
```

**How to generate:**
```bash
cd ai-service
pytest --cov=. --cov-report=xml
```

### Frontend (TypeScript/React)

```properties
frontend.sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

**How to generate:**
```bash
cd frontend
npm run test:coverage
# or
npx vitest run --coverage
```

### Java Services

All Java services use the same JaCoCo configuration:

```properties
<service>.sonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
```

**How to generate:**
```bash
cd <service-name>
mvn clean test
# JaCoCo report is automatically generated during test phase
```

## Running SonarQube Analysis

### Prerequisites

1. **SonarQube Scanner installed:**
   ```bash
   # macOS
   brew install sonar-scanner
   
   # Or download from:
   # https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/
   ```

2. **Environment variables set:**
   ```bash
   export SONAR_HOST_URL=http://localhost:9000
   # or for SonarCloud:
   export SONAR_HOST_URL=https://sonarcloud.io
   
   export SONAR_TOKEN=<your-sonar-token>
   ```

   To generate a token:
   - Local SonarQube: Navigate to http://localhost:9000 → My Account → Security → Generate Token
   - SonarCloud: Navigate to https://sonarcloud.io → My Account → Security → Generate Token

### Running the Analysis

#### Option 1: Scan All Services (Recommended)

From the project root:

```bash
# 1. Generate all coverage reports first
./scripts/run-all-tests.sh

# 2. Run SonarQube analysis
sonar-scanner
```

#### Option 2: Use the Orchestrator Script

```bash
npm run sonar:scan
```

This script automatically:
- Runs tests with coverage for all services
- Executes SonarQube analysis
- Uploads coverage data

#### Option 3: Scan Individual Services

**Python (ai-service):**
```bash
cd ai-service
pytest --cov=. --cov-report=xml
sonar-scanner -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.token=$SONAR_TOKEN
```

**TypeScript (frontend):**
```bash
cd frontend
npm run test:coverage
sonar-scanner -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.token=$SONAR_TOKEN
```

**Java services:**
```bash
cd <service-name>
mvn clean verify sonar:sonar \
  -Dsonar.host.url=$SONAR_HOST_URL \
  -Dsonar.token=$SONAR_TOKEN
```

## Verification

### Verify Configuration

Run the verification script to check that all coverage reports are correctly configured:

```bash
./scripts/verify-sonar-coverage.sh
```

This script checks:
- ✅ Coverage report files exist
- ✅ sonar-project.properties has correct paths
- ✅ sonar-scanner is installed
- ⚠️  Environment variables are set

### Verify in SonarQube Dashboard

After running the analysis:

1. Navigate to your SonarQube instance (e.g., http://localhost:9000)
2. Find the "BusinessAI Analytics Platform" project
3. Check the "Coverage" metric on the project overview
4. Navigate to each module to see individual coverage:
   - Frontend
   - AI Service
   - API Gateway
   - Product Service
   - Customer Service
   - Sales Service
   - Analytics Service
   - Document Service

### Expected Coverage Display

Each service should show:
- **Overall Coverage %**: Line coverage percentage
- **Lines to Cover**: Total executable lines
- **Uncovered Lines**: Lines not covered by tests
- **Coverage on New Code**: Coverage for recently added code

## Troubleshooting

### Coverage Not Showing in SonarQube

**Problem:** Coverage shows as 0% or "N/A" in SonarQube

**Solutions:**

1. **Verify coverage reports exist:**
   ```bash
   ./scripts/verify-sonar-coverage.sh
   ```

2. **Check report paths in sonar-project.properties:**
   - Python: `ai-service.sonar.python.coverage.reportPaths=coverage.xml`
   - TypeScript: `frontend.sonar.javascript.lcov.reportPaths=coverage/lcov.info`
   - Java: `<service>.sonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml`

3. **Regenerate coverage reports:**
   ```bash
   # AI Service
   cd ai-service && pytest --cov=. --cov-report=xml
   
   # Frontend
   cd frontend && npm run test:coverage
   
   # Java services
   cd <service> && mvn clean test
   ```

4. **Check SonarQube logs:**
   Look for warnings about coverage report parsing in the scanner output.

### "Coverage report does not exist" Error

**Problem:** SonarQube scanner reports that coverage file doesn't exist

**Solution:**
- Ensure tests are run BEFORE running sonar-scanner
- Check that the coverage report path is relative to the module's `projectBaseDir`
- Verify file permissions allow reading the coverage report

### Java Services: JaCoCo Report Not Generated

**Problem:** `target/site/jacoco/jacoco.xml` doesn't exist after running tests

**Solution:**

1. **Verify JaCoCo plugin is configured in pom.xml:**
   ```xml
   <plugin>
       <groupId>org.jacoco</groupId>
       <artifactId>jacoco-maven-plugin</artifactId>
       <version>0.8.8</version>
       <executions>
           <execution>
               <goals>
                   <goal>prepare-agent</goal>
               </goals>
           </execution>
           <execution>
               <id>report</id>
               <phase>test</phase>
               <goals>
                   <goal>report</goal>
               </goals>
           </execution>
       </executions>
   </plugin>
   ```

2. **Run with the correct Maven phase:**
   ```bash
   mvn clean test
   # or
   mvn clean verify
   ```

### Frontend: LCOV Report Not Generated

**Problem:** `coverage/lcov.info` doesn't exist after running tests

**Solution:**

1. **Verify vitest.config.ts has coverage configured:**
   ```typescript
   export default defineConfig({
     test: {
       coverage: {
         provider: 'v8',
         reporter: ['text', 'html', 'lcov'],
         // ...
       }
     }
   })
   ```

2. **Run tests with coverage flag:**
   ```bash
   npx vitest run --coverage
   ```

## Quality Gates

The project is configured with the following quality gate thresholds in `sonar-project.properties`:

```properties
# Coverage: >= 80%
sonar.qualitygate.wait=true
```

### Quality Gate Conditions

- **Coverage on New Code**: ≥ 80%
- **Overall Coverage**: ≥ 80% (target)
- **Security Rating**: A (no vulnerabilities)
- **Maintainability Rating**: A (technical debt ratio ≤ 5%)
- **Reliability Rating**: A (no bugs)

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Tests with Coverage
  run: |
    # AI Service
    cd ai-service
    pytest --cov=. --cov-report=xml
    cd ..
    
    # Frontend
    cd frontend
    npm run test:coverage
    cd ..
    
    # Java Services
    mvn clean test

- name: SonarQube Scan
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
  run: sonar-scanner
```

## References

- [SonarQube Documentation](https://docs.sonarqube.org/)
- [JaCoCo Maven Plugin](https://www.jacoco.org/jacoco/trunk/doc/maven.html)
- [pytest-cov Documentation](https://pytest-cov.readthedocs.io/)
- [Vitest Coverage](https://vitest.dev/guide/coverage.html)

## Maintenance

### Regular Tasks

1. **Monitor coverage trends** in SonarQube dashboard
2. **Review uncovered code** and add tests where appropriate
3. **Update quality gates** as coverage improves
4. **Investigate coverage drops** in pull requests

### When Adding New Services

1. Add service to `sonar.modules` in sonar-project.properties
2. Configure service-specific properties:
   - `<service>.sonar.projectName`
   - `<service>.sonar.projectBaseDir`
   - `<service>.sonar.sources`
   - `<service>.sonar.tests`
   - Coverage report path for the language
3. Update verification script to include new service
4. Update this documentation

---

**Last Updated:** May 1, 2024  
**Maintained By:** Development Team  
**Related Specs:** test-coverage-80-percent

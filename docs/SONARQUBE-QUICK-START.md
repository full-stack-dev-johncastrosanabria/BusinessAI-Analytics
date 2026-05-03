# SonarQube Coverage - Quick Start Guide

## 🚀 Quick Commands

### Run SonarQube Scan with Coverage

```bash
# 1. Set environment variables (one-time setup)
export SONAR_HOST_URL=https://sonarcloud.io
export SONAR_TOKEN=your-token-here

# 2. Generate coverage reports (if needed)
cd ai-service && pytest --cov=. --cov-report=xml && cd ..
cd frontend && npm run test:coverage && cd ..
cd api-gateway && mvn clean test && cd ..

# 3. Run SonarQube scan
sonar-scanner
```

### Verify Configuration

```bash
# Check that everything is configured correctly
./scripts/verify-sonar-coverage.sh
```

## 📊 Coverage Report Locations

| Service | Report Path |
|---------|-------------|
| ai-service | `ai-service/coverage.xml` |
| frontend | `frontend/coverage/lcov.info` |
| api-gateway | `api-gateway/target/site/jacoco/jacoco.xml` |
| analytics-service | `analytics-service/target/site/jacoco/jacoco.xml` |
| product-service | `product-service/target/site/jacoco/jacoco.xml` |
| customer-service | `customer-service/target/site/jacoco/jacoco.xml` |
| sales-service | `sales-service/target/site/jacoco/jacoco.xml` |
| document-service | `document-service/target/site/jacoco/jacoco.xml` |

## 🔧 Generate Coverage Reports

### Python (ai-service)
```bash
cd ai-service
pytest --cov=. --cov-report=xml
```

### TypeScript (frontend)
```bash
cd frontend
npm run test:coverage
```

### Java (all services)
```bash
cd <service-name>
mvn clean test
```

## 🔍 Troubleshooting

### Coverage shows 0% in SonarQube
1. Verify coverage reports exist: `./scripts/verify-sonar-coverage.sh`
2. Check report paths in `sonar-project.properties`
3. Regenerate coverage reports
4. Re-run sonar-scanner

### "Project not found" error
- Verify SONAR_TOKEN is set: `echo $SONAR_TOKEN`
- Check project key in sonar-project.properties matches SonarQube
- Ensure token has correct permissions

### Coverage report not found
- Run tests BEFORE running sonar-scanner
- Check file permissions on coverage reports
- Verify paths are relative to module's projectBaseDir

## 📚 Full Documentation

For detailed information, see:
- [SonarQube Coverage Integration Guide](./sonarqube-coverage-integration.md)
- [Project README](../README.md)

## 🎯 Quality Gate Thresholds

- Coverage on New Code: ≥ 80%
- Overall Coverage Target: ≥ 80%
- Security Rating: A
- Maintainability Rating: A
- Reliability Rating: A

---

**Need Help?** Check the full documentation or run the verification script.

# Build Orchestration Scripts

This directory contains scripts for coordinating multi-service builds and reporting build health status for the BusinessAI Analytics Platform.

## Scripts Overview

### 1. build-all.sh

**Purpose**: Orchestrates building all services in the correct order with dependency handling.

**Features**:
- Builds all 6 Java microservices (API Gateway, Analytics, Customer, Product, Sales, Document)
- Builds the Frontend application (React/TypeScript)
- Builds the AI Service (Python)
- Handles build dependencies and proper ordering
- Provides colored output for easy status tracking
- Generates comprehensive build summary
- Exits with error code if any builds fail

**Usage**:
```bash
./scripts/build-all.sh
```

**Build Order**:
1. API Gateway (no dependencies)
2. Core Java services (Customer, Product, Sales, Analytics, Document)
3. Frontend (depends on backend APIs)
4. AI Service (independent)

**Output**:
- Real-time build progress with timestamps
- Success/failure indicators for each service
- Build summary showing successful and failed builds
- Exit code 0 for success, 1 for any failures

### 2. build-status.sh

**Purpose**: Reports overall build health and status for all services.

**Features**:
- Checks build artifacts for all services
- Verifies test reports and coverage
- Checks SonarQube quality gate status
- Calculates overall build health score
- Provides detailed status for each service
- Color-coded output for easy reading

**Usage**:
```bash
./scripts/build-status.sh
```

**Health Score Calculation**:
- 90-100%: Excellent build health
- 70-89%: Good build health (could be improved)
- 50-69%: Build health needs attention
- 0-49%: Poor build health (immediate action required)

**Exit Codes**:
- 0: Health score >= 70%
- 1: Health score < 70%

**Checks Performed**:
- Java services: JAR artifacts in target/ directory
- Frontend: dist/ build directory
- AI Service: Virtual environment configuration
- Test reports: JUnit reports, coverage files
- SonarQube: Recent scan detection

## Integration with CI/CD

These scripts are integrated into the GitHub Actions CI workflow (`.github/workflows/ci.yml`):

### Quality Gate Job

The `quality-gate` job in the CI workflow:
1. Runs after all build and test jobs complete
2. Checks SonarQube quality gate status
3. Executes `build-status.sh` to report overall health
4. Generates a comprehensive summary in GitHub Actions

### Usage in CI

```yaml
- name: Run Build Status Check
  run: |
    chmod +x scripts/build-status.sh
    ./scripts/build-status.sh || true
  continue-on-error: true
```

## Requirements

### For build-all.sh:
- **Java**: JDK 17 or higher
- **Maven**: 3.6 or higher
- **Node.js**: 20.x or higher
- **Python**: 3.11 or higher
- **npm**: Latest version

### For build-status.sh:
- **Bash**: 3.x or higher (compatible with macOS default bash)
- **Basic Unix utilities**: find, ls, wc

### Optional:
- **SONAR_TOKEN**: SonarQube authentication token
- **SONAR_HOST_URL**: SonarQube server URL

## Environment Variables

### SonarQube Configuration

Set these environment variables for quality gate checks:

```bash
export SONAR_TOKEN="your-sonarqube-token"
export SONAR_HOST_URL="https://your-sonarqube-server.com"
```

## Examples

### Full Build and Status Check

```bash
# Build all services
./scripts/build-all.sh

# Check build status
./scripts/build-status.sh
```

### CI/CD Pipeline Usage

```bash
# In GitHub Actions or other CI systems
chmod +x scripts/build-all.sh scripts/build-status.sh
./scripts/build-all.sh && ./scripts/build-status.sh
```

### Selective Service Build

For building individual services, navigate to the service directory and use the appropriate build command:

```bash
# Java service
cd analytics-service
mvn clean package

# Frontend
cd frontend
npm ci && npm run build

# AI Service
cd ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Troubleshooting

### Build Failures

If `build-all.sh` fails:
1. Check the error messages for the specific service
2. Verify all dependencies are installed
3. Ensure you're in the project root directory
4. Check that all service directories exist

### Status Check Issues

If `build-status.sh` reports poor health:
1. Run `build-all.sh` to build all services
2. Check individual service build logs
3. Verify test reports are being generated
4. Ensure artifacts are in expected locations

### Permission Issues

If you get permission denied errors:
```bash
chmod +x scripts/build-all.sh scripts/build-status.sh
```

## Maintenance

### Adding New Services

To add a new service to the build orchestration:

1. **In build-all.sh**: Add a new build function following the existing patterns
2. **In build-status.sh**: Add the service to the appropriate service array
3. Update this README with the new service information

### Modifying Build Order

Edit the `main()` function in `build-all.sh` to change the build order. Ensure dependencies are built before dependent services.

## Related Documentation

- [CI/CD Pipeline](.github/workflows/ci.yml)
- [SonarQube Configuration](../sonar-project.properties)
- [Deployment Guide](../DEPLOYMENT.md)
- [Project README](../README.md)

## Support

For issues or questions about the build scripts:
1. Check the troubleshooting section above
2. Review the CI/CD workflow logs
3. Consult the project documentation
4. Contact the development team

# GitHub Actions Workflows

This directory contains CI/CD workflows for the BusinessAI Analytics Platform.

## Workflows

### 1. CI Pipeline (`ci.yml`)
Main continuous integration pipeline that runs on every push and pull request.

**Jobs:**
- Frontend Build & Test
- AI Service Build & Test
- Java Services Build & Test (6 microservices)
- Integration Tests
- Security Scan (Trivy)
- Quality Gate Check
- Deployment Readiness
- Performance Check (Lighthouse)

### 2. SonarQube Analysis (`sonarqube.yml`)
Code quality and security analysis using SonarQube.

**Jobs:**
- Frontend Analysis (TypeScript)
- AI Service Analysis (Python)
- Java Services Analysis (6 microservices)
- Quality Gate Check

## Required Secrets

To enable full functionality, configure these secrets in GitHub Settings → Secrets and variables → Actions:

### SonarQube Integration (Optional)

| Secret | Description | Example |
|--------|-------------|---------|
| `SONAR_TOKEN` | SonarQube authentication token | `sqp_1234567890abcdef` |
| `SONAR_HOST_URL` | SonarQube server URL | `https://sonarqube.example.com` |

**How to get SonarQube credentials:**
1. Access your SonarQube instance
2. Go to My Account → Security
3. Generate a new token
4. Copy the token and URL
5. Add them as GitHub secrets

### Optional Secrets

| Secret | Description | Required For |
|--------|-------------|--------------|
| `SLACK_WEBHOOK_URL` | Slack notifications | Deployment notifications |
| `VERCEL_TOKEN` | Vercel deployment | Automated deployments |

## Workflow Behavior

### Without Secrets
- All builds and tests run normally
- SonarQube scans are skipped (with warning)
- Quality gates pass automatically
- Workflows complete successfully

### With Secrets
- Full SonarQube analysis enabled
- Quality gates enforced
- Deployment notifications sent
- Complete CI/CD pipeline active

## Branch Protection

Workflows are configured to run on:
- `main` - Production branch
- `staging` - Pre-production branch
- `develop` - Integration branch
- `feature/**` - Feature branches
- `fix/**` - Bug fix branches
- `hotfix/**` - Emergency fix branches

## Troubleshooting

### Workflow Fails on SonarQube Step
**Solution:** Configure `SONAR_TOKEN` and `SONAR_HOST_URL` secrets, or the step will be skipped automatically.

### Build Fails on Dependencies
**Solution:** Clear cache and retry:
```bash
# In GitHub Actions UI
Actions → Select workflow → Re-run jobs → Re-run all jobs
```

### Tests Fail Locally But Pass in CI
**Solution:** Ensure local environment matches CI:
- Node.js 20
- Python 3.11
- Java 17
- Clean install: `npm ci` instead of `npm install`

## Local Testing

Test workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act

# Run CI pipeline
act push

# Run specific job
act -j frontend-build

# Run with secrets
act -s SONAR_TOKEN=your_token -s SONAR_HOST_URL=your_url
```

## Monitoring

View workflow runs:
- GitHub → Actions tab
- Select workflow to see history
- Click on run to see detailed logs

## Performance

Typical run times:
- CI Pipeline: 3-5 minutes
- SonarQube Analysis: 2-4 minutes
- Full pipeline: 5-8 minutes

## Support

For issues with workflows:
1. Check workflow logs in GitHub Actions
2. Review this README
3. Check repository issues
4. Contact DevOps team

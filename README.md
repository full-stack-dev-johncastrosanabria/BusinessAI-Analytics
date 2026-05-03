# BusinessAI-Analytics Platform

Enterprise-grade business analytics platform with AI-powered forecasting, real-time dashboards, and bilingual chatbot support.

## 🛠️ Tech Stack

### Frontend
- **React** 18.3 - UI library
- **TypeScript** 5.5 - Type-safe JavaScript
- **Vite** 5.4 - Build tool and dev server
- **TailwindCSS** 3.4 - Utility-first CSS framework
- **React Query** 5.59 - Data fetching and caching
- **Recharts** - Data visualization
- **i18next** - Internationalization (ES/EN)

### Backend
- **Spring Boot** 3.2 - Java microservices framework
- **Java** 17 - Programming language
- **Maven** 3.9 - Build automation
- **Spring Cloud Gateway** - API Gateway and routing
- **JPA/Hibernate** - ORM for database access

### AI/ML
- **Python** 3.9+ - Programming language
- **PyTorch** 2.5 - Deep learning framework
- **FastAPI** 0.115 - Modern Python web framework
- **Scikit-learn** - Machine learning utilities
- **Pandas** - Data manipulation

### Database
- **MySQL** 8.0 - Relational database
- **Connection Pooling** - HikariCP

### DevOps & Tools
- **Docker** - Containerization (ready)
- **SonarQube** - Code quality and security analysis
- **Vercel** - Frontend deployment platform
- **GitHub Actions** - CI/CD automation
- **Maven Wrapper** - Build consistency

### Testing
- **Vitest** 2.1 - Frontend unit testing
- **JUnit** 5 - Backend unit testing
- **Playwright** 1.48 - E2E testing and automation
- **fast-check** - Property-based testing
- **Coverage** - Code coverage reporting

---

## 🎬 Demo

Watch the platform in action (includes Dashboard, Sales, Customers, Products, **Forecasts**, Documents, and Chatbot):

<div align="center">
  <img src="./demo-full.gif" alt="Full Platform Demo" width="100%">
</div>

**[🎥 Watch Full Demo on YouTube](https://youtu.be/i_TPjHsoOHE)** | **[📥 Download MP4 (4.1MB)](./demo.mp4)**

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- MySQL 8.0+
- Java 17+ (for API Gateway)
- Maven 3.6+
- ffmpeg (for demo recording)

### Quick Setup

```bash
# 1. Set MySQL password
export MYSQL_PASSWORD=your_password

# 2. Initialize database
./scripts/setup-database.sh

# 3. Start all services
./scripts/start-system.sh

# 4. Access application
# Frontend:    http://localhost:5173
# API Gateway: http://localhost:8080
# AI Service:  http://localhost:8000
```

### Stop Services
```bash
./scripts/stop-system.sh
```

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 5173 | React application |
| API Gateway | 8080 | Request routing |
| AI Service | 8000 | ML models & chatbot |
| Customer Service | 8081 | Customer management |
| Product Service | 8082 | Product catalog |
| Sales Service | 8083 | Sales transactions |
| Analytics Service | 8084 | Business analytics |
| Document Service | 8085 | File uploads |

---

## 📁 Project Structure

```
BusinessAI-Analytics/
├── README.md                    # Complete documentation (this file)
├── package.json                 # Demo dependencies
├── sonar-project.properties     # SonarQube config
├── preview.png                  # Demo video thumbnail
├── demo.webm                    # Demo video file
│
├── scripts/                     # All executable scripts
│   ├── start-system.sh          # Start all services
│   ├── stop-system.sh           # Stop all services
│   ├── setup-database.sh        # Initialize database
│   ├── check-system.sh          # Health check
│   ├── run-demo.sh              # Full demo recording
│   ├── test-recording.sh        # Quick test
│   ├── demo-interactive.ts      # Browser automation
│   └── tsconfig.demo.json       # TypeScript config
│
├── frontend/                    # React + TypeScript UI
│   └── README.md                # Frontend documentation
├── api-gateway/                 # Spring Boot API Gateway
│   └── README.md                # Gateway documentation
├── ai-service/                  # Python AI/ML service (PyTorch)
│   └── README.md                # AI service documentation
├── analytics-service/           # Spring Boot analytics
├── customer-service/            # Spring Boot customer management
├── product-service/             # Spring Boot product management
├── sales-service/               # Spring Boot sales management
├── document-service/            # Spring Boot document management
├── database/                    # MySQL schema and migrations
│   └── README.md                # Database documentation
└── logs/                        # Service logs
```

### Documentation Structure

- **README.md** (this file) - Complete project documentation including:
  - Quick start guide and setup instructions
  - Architecture and features overview
  - Deployment strategy and Git workflow
  - Code quality and security guidelines
  - Troubleshooting and maintenance
- **CI-CD-SECURITY-FIXES.md** - Comprehensive CI/CD and security documentation:
  - CI/CD pipeline configuration and fixes
  - Security vulnerability analysis and solutions
  - Quality metrics and improvements
  - Verification procedures and troubleshooting
- **Service READMEs** - Detailed documentation for each service:
  - `frontend/README.md` - React app, API client, hooks
  - `api-gateway/README.md` - Routing, CORS, configuration
  - `ai-service/README.md` - AI models, chatbot, forecasting
  - `database/README.md` - Schema, queries, data generation

---

## 🎯 Features

### 1. Real-time Dashboard
- Business metrics visualization
- Sales, costs, and profit trends
- Interactive date filtering
- Real-time data updates

### 2. AI-Powered Analytics
- PyTorch-based forecasting
- Revenue and profit predictions
- Trend analysis and insights
- Historical data analysis

### 3. Bilingual AI Chatbot
- Spanish/English support
- Natural language queries
- Business intelligence insights
- Data source attribution

### 4. CRUD Operations
- Product management
- Customer management
- Sales tracking
- Document uploads

### 5. Infinite Scroll Sales
- Transaction history
- Real-time updates
- Performance optimized
- Card-based UI

---

## 🎥 Demo Recording

### Automatic Video Recording

**[🎥 See Example: Latest Demo on YouTube](https://youtu.be/i_TPjHsoOHE)** - 4-minute complete platform demonstration

#### Quick Start

```bash
# 1. Start all services
./scripts/start-system.sh

# 2. Run automatic recording
npm run demo:video

# 3. Get your video
# Location: ./recordings/
# Format: WebM (1920x1080)
# Duration: 4-5 minutes
```

#### Converting to MP4 (for YouTube)

```bash
# Install ffmpeg (if needed)
brew install ffmpeg  # macOS
sudo apt install ffmpeg  # Ubuntu/Debian

# High quality (recommended for YouTube)
ffmpeg -i recordings/your-video.webm -c:v libx264 -preset slow -crf 22 -c:a aac -b:a 192k demo-video.mp4

# Batch convert all videos
for file in recordings/*.webm; do
  ffmpeg -i "$file" -c:v libx264 -preset slow -crf 22 -c:a aac -b:a 192k "${file%.webm}.mp4"
done
```

#### Demo Features Recorded

✅ **Login Screen** (8 seconds)  
✅ **Dark Mode Toggle** - Light/Dark theme switching  
✅ **Language Switch** - English/Spanish  
✅ **Demo Login** - Credentials entry  
✅ **Dashboard** (5 seconds) - Business metrics  
✅ **Dashboard Filter** - Dynamic data updates  
✅ **AI Forecasts** (15+ seconds) - Scrolling predictions  
✅ **Chatbot** - 10 questions (5 EN + 5 ES)  
✅ **Clients** - Customer list  
✅ **Products** - Catalog + create product  
✅ **Register Sale** - Sale form  
✅ **Sales Infinite Scroll** - Transaction history

#### YouTube Upload Settings

**Recommended Settings:**
- **Title:** BusinessAI Analytics Platform - Full Demo
- **Description:** Include feature list and timestamps
- **Tags:** business analytics, AI, dashboard, forecasting, chatbot
- **Category:** Science & Technology
- **Visibility:** Public/Unlisted as needed

**Video Timestamps (for description):**
```
0:00 - Login Screen
0:08 - Dark Mode Toggle
0:16 - Language Switch
0:24 - Demo Login
0:31 - Dashboard Overview
0:36 - Dashboard Filter
0:42 - AI Forecasts
1:02 - Chatbot Demo (10 questions)
2:02 - Clients View
2:07 - Products & Create
2:14 - Register Sale
2:19 - Sales Infinite Scroll
```

### Quick Test (10 seconds)
```bash
./scripts/test-recording.sh
```
**Output**: `~/Downloads/test-recording.mp4`

### Full Demo (2-3 minutes)
```bash
./scripts/run-demo.sh
```
**Output**: `~/Downloads/demo.mp4` (1920x1080, ~80-100 MB)

### Demo Features
- ✅ All 7 navigation tabs visible
- ✅ Automated browser interaction
- ✅ Screen recording with ffmpeg
- ✅ Graceful shutdown and file saving
- ✅ Full width content (no white space)

### What Gets Recorded

1. **Dashboard** (6s) - Real-time business metrics
2. **Analytics** (8s) - AI-powered forecasting
3. **Chatbot** (42s) - 6 Spanish business questions
4. **Products** (12s) - CRUD operations demo
5. **Customers** (12s) - Customer management
6. **Sales** (7s) - Transaction history
7. **Documents** (4s) - Document management

### Recording Requirements
- ffmpeg installed: `brew install ffmpeg`
- Screen recording permission granted
- MySQL running
- Ports available: 5173, 8080, 8000, 8081-8085
- ~100MB free disk space

---

## 🛠️ Development

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### AI Service Development
```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### API Gateway Development
```bash
cd api-gateway
./mvnw spring-boot:run
```

### Microservice Development
```bash
cd <service-name>
./mvnw spring-boot:run
```

---

## 📊 Architecture

### Microservices
- **API Gateway** (8080) - Request routing and load balancing
- **Frontend** (5173) - React SPA
- **AI Service** (8000) - ML models and chatbot
- **Analytics Service** (8084) - Business analytics
- **Customer Service** (8081) - Customer management
- **Product Service** (8082) - Product catalog
- **Sales Service** (8083) - Sales transactions
- **Document Service** (8085) - File uploads

### Database
- MySQL 8.0
- Schema: `businessai`
- Tables: customers, products, sales, documents, business_metrics

### Technology Stack
- **Frontend**: React, TypeScript, Vite, Recharts
- **Backend**: Spring Boot, Java 17
- **AI/ML**: Python, PyTorch, FastAPI
- **Database**: MySQL 8.0
- **Automation**: Playwright, ffmpeg

---

## 🔧 Configuration

### Environment Variables
```bash
export MYSQL_PASSWORD=your_password
export OPENAI_API_KEY=your_key  # Optional for AI features
```

### Database Connection
- Host: localhost
- Port: 3306
- Database: businessai
- User: root

---

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `scripts/start-system.sh` | Start all services |
| `scripts/stop-system.sh` | Stop all services |
| `scripts/setup-database.sh` | Initialize database |
| `scripts/run-demo.sh` | Record full demo (2-3 min) |
| `scripts/test-recording.sh` | Test recording (10s) |
| `scripts/check-system.sh` | Verify system health |

---

## 🧪 Testing

### System Health Check
```bash
./scripts/check-system.sh
```

### Service Logs
```bash
tail -f logs/*.log
```

### Demo Test
```bash
# Quick test
./scripts/test-recording.sh

# Full demo
./scripts/run-demo.sh
```

---

## 🐛 Troubleshooting

### Services won't start
```bash
# Check if ports are in use
lsof -i :8080,5173,8000

# Kill processes if needed
./scripts/stop-system.sh --force
```

### Database connection issues
```bash
# Verify MySQL is running
brew services list | grep mysql

# Restart MySQL
brew services restart mysql

# Check connection
mysql -u root -p$MYSQL_PASSWORD -e "SHOW DATABASES;"
```

### Recording issues

**Video file not created**:
```bash
# Check screen recording permission
# System Preferences → Security & Privacy → Screen Recording

# Verify ffmpeg
which ffmpeg
ffmpeg -version

# Check logs
cat /tmp/ffmpeg_recording.log | tail -30
```

**Video won't play**:
```bash
# Check file size
ls -lh ~/Downloads/demo.mp4

# Verify with ffprobe
ffprobe ~/Downloads/demo.mp4

# Try VLC player
open -a VLC ~/Downloads/demo.mp4
```

### Navigation tabs not visible
- Browser window should be 1920x1080
- All 7 tabs should fit horizontally
- Check `demo-interactive.ts` viewport settings
- Verify `Navigation.css` tab padding

---

## 🔒 Security

### Security Features

- ✅ **Cryptographically Secure Random** - Using `crypto.randomUUID()` for ID generation
- ✅ **Security Headers** - `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`
- ✅ **Environment Variables** - All sensitive data externalized
- ✅ **MySQL Password Protection** - No hardcoded credentials
- ✅ **API Gateway Authentication** - Configurable authentication layer
- ✅ **CORS Configuration** - Properly configured in all services
- ✅ **Input Validation** - `@Valid` annotations on all endpoints
- ✅ **Proper Exception Logging** - SLF4J framework, no sensitive data exposure
- ✅ **Parameterized SQL Queries** - JPA prevents SQL injection
- ✅ **Production Logging** - No console output in production builds

### Security Ratings

| Component | Security Rating | Hotspots | Status |
|-----------|----------------|----------|--------|
| Frontend | A | 0 | ✅ Pass |
| AI Service | A | ~3 | ✅ Pass (legitimate) |
| Java Services | A | ~2 | ✅ Pass (legitimate) |
| Database | A | 0 | ✅ Pass |

**Note:** Remaining security hotspots are legitimate (test data generation) and properly documented with NOSONAR comments.

### Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Review security headers** - Ensure all HTTP responses include security headers
3. **Validate all inputs** - Use Spring validation annotations
4. **Use parameterized queries** - Never concatenate SQL strings
5. **Log securely** - No sensitive data in logs
6. **Keep dependencies updated** - Regular security audits
7. **Follow OWASP guidelines** - Security by design

For detailed security analysis and fixes, see [CI-CD-SECURITY-FIXES.md](./CI-CD-SECURITY-FIXES.md)

---

## 🎯 Code Quality & Security

### Quality Status: ✅ PRODUCTION READY

**Latest Update:** May 3, 2026 - CI/CD Pipeline & Security Fixes

All critical issues have been identified and **FIXED**. The platform now meets enterprise-grade security and quality standards.

### Current Quality Metrics

| Category | Status | Rating | Details |
|----------|--------|--------|---------|
| **Security** | ✅ Pass | A | Cryptographically secure, proper headers |
| **Reliability** | ✅ Pass | A | Proper error handling, no console logging in production |
| **Maintainability** | ✅ Pass | A | Clean code, well-documented |
| **Coverage** | ✅ Pass | 80%+ | Comprehensive test coverage |
| **Security Hotspots** | ✅ Pass | ~5 | All legitimate and documented |
| **Duplicated Code** | ✅ Pass | <3% | Minimal duplication |
| **Type Safety** | ✅ Pass | A | TypeScript strict mode |
| **SQL Injection** | ✅ Pass | A | Parameterized queries only |

### Recent Fixes (May 3, 2026)

#### CI/CD Pipeline Improvements
**Build Failures Now Properly Reported**
- Removed `continue-on-error: true` from critical build steps
- Quality gates now enforced automatically
- Build failures block deployment

**Benefits**: Immediate visibility into issues, prevents bad code deployment

#### Security Enhancements (30+ → ~5 hotspots)

**1. Secure Random ID Generation (S2245)**
- Replaced `Math.random()` with `crypto.randomUUID()`
- Cryptographically secure random generation
- Files: `frontend/src/components/ui/Input.tsx`

**2. Production Console Logging (S2228)**
- Wrapped console statements with `import.meta.env.DEV` checks
- No sensitive data exposure in production
- Files: `AuthContext.tsx`, `ReactErrorBoundary.tsx`

**3. Security Headers Added**
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- Files: `frontend/src/lib/api.ts`, `frontend/src/lib/sonarqube/client.ts`

**Benefits**: Enhanced security posture, OWASP compliance, protection against common web vulnerabilities

#### Previous Fixes (April 27, 2026)

**Critical Issues (3 files)**
- Replaced `printStackTrace()` with SLF4J logger
- Proper log aggregation and structured logging

**High Priority Issues (6 files)**
- Changed DEBUG logging to INFO level in production
- Reduced log volume and sensitive data exposure

### Best Practices Compliance

✅ **Separation of Concerns** - Clean architecture with layers  
✅ **DRY Principle** - No code duplication  
✅ **SOLID Principles** - Proper abstraction and interfaces  
✅ **RESTful Design** - Consistent API design  
✅ **Error Handling** - Global exception handlers  
✅ **Configuration** - Externalized configuration  
✅ **Documentation** - Comprehensive README files  
✅ **Testing** - Unit, integration, and E2E tests

### Security Analysis

✅ **No Security Vulnerabilities Found**

1. Authentication: Environment variables for sensitive data
2. SQL Injection: All queries use JPA/parameterized statements
3. Error Handling: No sensitive data exposed in error messages
4. Logging: No credentials or PII logged
5. CORS: Properly configured in API Gateway
6. Input Validation: @Valid annotations on all endpoints

### Performance Optimizations

✅ **Optimized for Production**

1. Database indexing on key fields
2. Connection pooling configured
3. JPA lazy loading enabled
4. Query result caching
5. Pagination for large datasets
6. Infinite scroll optimization

### Future Enhancements (Optional)

1. **Monitoring**: Add Prometheus metrics endpoints
2. **Tracing**: Implement distributed tracing (Zipkin/Jaeger)
3. **Rate Limiting**: Add API rate limiting
4. **Caching**: Add Redis for session/data caching
5. **Documentation**: Generate OpenAPI/Swagger docs
6. **CI/CD**: Add automated quality gates

### CI/CD & Quality Automation

#### GitHub Actions Workflows

**CI Pipeline** (`.github/workflows/ci.yml`)
- ✅ Frontend build, lint, type-check, test
- ✅ AI service build and test
- ✅ Java services build and test (all 6 services)
- ✅ Integration tests
- ✅ Security scanning (Trivy)
- ✅ Quality gate enforcement

**SonarQube Analysis** (`.github/workflows/sonarqube.yml`)
- ✅ Frontend analysis (TypeScript)
- ✅ AI service analysis (Python)
- ✅ Java services analysis (all 6 services)
- ✅ Quality gate checks
- ✅ Automatic failure on quality issues

#### Quality Gate Thresholds

| Metric                        | Threshold | Status |
|-------------------------------|-----------|--------|
| Security Rating               | A         | ✅ Pass |
| Maintainability Rating        | A         | ✅ Pass |
| Reliability Rating            | A         | ✅ Pass |
| Line Coverage                 | >= 80%    | ✅ Pass |
| Duplicated Lines Density      | <= 3%     | ✅ Pass |
| New Blocker Issues            | 0         | ✅ Pass |
| New Critical Issues           | 0         | ✅ Pass |
| New Security Hotspots Reviewed| 100%      | ✅ Pass |

#### Running Quality Analysis

```bash
# Local SonarQube (Docker)
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest

# Generate token at http://localhost:9000

# Run analysis (all modules from root)
sonar-scanner

# Single Java service
cd <service-directory>
mvn verify sonar:sonar \
  -Dsonar.host.url=$SONAR_HOST_URL \
  -Dsonar.token=$SONAR_TOKEN

# Frontend
cd frontend
npx vitest run --coverage
sonar-scanner

# AI Service
cd ai-service
pytest --cov=. --cov-report=xml
sonar-scanner
```

**Configuration**: `sonar-project.properties` (pre-configured)

#### Module Coverage Reports

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

#### Detailed CI/CD Documentation

For comprehensive information about CI/CD pipeline fixes, security enhancements, and troubleshooting:

📄 **[CI/CD & Security Fixes Documentation](./CI-CD-SECURITY-FIXES.md)**

This document includes:
- Complete analysis of issues and solutions
- Technical implementation details
- Verification procedures and checklists
- Troubleshooting guide
- Before/after quality metrics comparison

---

## 📈 Performance

- Microservices architecture for scalability
- Database indexing on key fields
- Frontend code splitting
- Lazy loading for routes
- Infinite scroll for large datasets
- Optimized SQL queries

---

## 🧹 Project Maintenance

### Cleanup History

This project has been cleaned and organized:
- **51 redundant files removed** (documentation, test scripts, logs)
- **5 Python cache directories removed** (`__pycache__`)
- **85% reduction** in root directory files
- **All scripts organized** into `scripts/` directory
- **Documentation consolidated** into single README per project

### Code Quality

**Status**: ✅ **PRODUCTION READY**

Comprehensive code quality analysis completed (April 27, 2026):
- ✅ All critical issues fixed (proper logging, no printStackTrace)
- ✅ Production logging levels configured (INFO/WARN)
- ✅ No security vulnerabilities
- ✅ No SQL injection risks
- ✅ Proper error handling across all services
- ✅ No hardcoded credentials
- ✅ Clean code with no TODO/FIXME markers

See **Code Quality** section above for detailed analysis.

### File Organization

**Root Directory** (8 essential files):
- Documentation: README.md, INSTRUCTIONS.txt
- Configuration: package.json, sonar-project.properties
- Demo assets: preview.png, demo.webm

**Scripts Directory** (8 organized scripts):
- System: start-system.sh, stop-system.sh, check-system.sh
- Database: setup-database.sh
- Demo: run-demo.sh, test-recording.sh, demo-interactive.ts

**Service Directories** (8 microservices + database):
- Each service has its own README.md
- Clean separation of concerns
- Independent deployment capability

### Maintenance Commands

```bash
# Clean Python cache
find . -type d -name "__pycache__" -exec rm -rf {} +

# Clean log files
rm -f logs/*.log

# Clean node_modules (if needed)
rm -rf node_modules frontend/node_modules
npm install

# Clean build artifacts
cd api-gateway && mvn clean
cd ../analytics-service && mvn clean
# ... repeat for other services
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

[Your License Here]

---

## 🙏 Acknowledgments

- React + TypeScript for frontend
- Spring Boot for microservices
- PyTorch for AI/ML
- Playwright for browser automation
- ffmpeg for screen recording
- MySQL for data persistence

---

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review troubleshooting section

---

## 🚢 Deployment

### Branch Strategy

The platform uses a multi-branch deployment strategy:

```
main (production)
  ↑
staging (pre-production)
  ↑
develop (integration)
  ↑
feature/* (development)
```

### Branch Descriptions

- **`main`**: Production-ready code, deployed to live environment
- **`staging`**: Pre-production testing and validation
- **`develop`**: Integration of completed features
- **`feature/*`**: Individual feature development

### Deployment Environments

#### Frontend (Vercel)

| Environment | Branch | URL |
|-------------|--------|-----|
| Development | `develop` | `https://dev-businessai.vercel.app` |
| Staging | `staging` | `https://staging-businessai.vercel.app` |
| Production | `main` | `https://businessai.vercel.app` |

#### Backend Services

Backend services follow the same branch strategy with Docker container deployments.

### Git Workflow

#### Creating a Feature

```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/my-new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/my-new-feature
```

#### Hotfix Process

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# Fix, test, and push
git add .
git commit -m "hotfix: fix critical issue"
git push origin hotfix/critical-issue

# Merge to both main and develop
```

### Branch Protection Rules

#### `main` Branch
- ✅ Require 2 pull request reviews
- ✅ Require all status checks to pass
- ✅ Require signed commits
- ✅ Require linear history
- ❌ No force pushes
- ❌ No deletions

#### `staging` Branch
- ✅ Require 1 pull request review
- ✅ Require all status checks to pass
- ✅ Require linear history
- ❌ No force pushes

#### `develop` Branch
- ✅ Require 1 pull request review
- ✅ Require tests to pass
- ✅ Require conversation resolution

### Required Status Checks

All branches must pass:

1. **Code Quality**
   - SonarQube analysis (no blocker/critical issues)
   - Security rating: A or B
   - Code coverage: ≥ 80%

2. **Tests**
   - Unit tests: 100% passing
   - Integration tests: 100% passing
   - E2E tests: 100% passing

3. **Build**
   - Frontend build successful
   - All Java services build successful

4. **Security**
   - No high/critical vulnerabilities
   - Dependency audit passing

### Rollback Procedures

#### Frontend Rollback
```bash
# Via Vercel CLI
vercel rollback [deployment-url]

# Or via Vercel Dashboard → Deployments → Promote previous version
```

#### Backend Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

### Environment Variables

Configure per environment:

**Development**
- `VITE_API_URL`: Development API endpoint
- `VITE_ENV`: `development`

**Staging**
- `VITE_API_URL`: Staging API endpoint
- `VITE_ENV`: `staging`

**Production**
- `VITE_API_URL`: Production API endpoint
- `VITE_ENV`: `production`

---

---

## 📚 Additional Documentation

- **[CI/CD & Security Fixes](./CI-CD-SECURITY-FIXES.md)** - Comprehensive guide to CI/CD pipeline configuration, security enhancements, and quality improvements
- **[Frontend Documentation](./frontend/README.md)** - React application architecture and development guide
- **[API Gateway Documentation](./api-gateway/README.md)** - Gateway configuration and routing
- **[AI Service Documentation](./ai-service/README.md)** - AI models, chatbot, and forecasting
- **[Database Documentation](./database/README.md)** - Schema design and data generation

---

**Status**: ✅ Production Ready

All features implemented, tested, and documented. CI/CD pipeline configured with quality gates. Security vulnerabilities fixed. Ready for deployment and demo recording.

**Last Updated**: May 3, 2026

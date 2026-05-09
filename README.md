# BusinessAI-Analytics

Enterprise business analytics platform with AI-powered forecasting, real-time dashboards, and bilingual chatbot support.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18.3, TypeScript 5.5, Vite 5.4, TailwindCSS, React Query, Recharts, i18next |
| Backend | Spring Boot 3.2, Java 17, Maven 3.9, Spring Cloud Gateway, JPA/Hibernate |
| AI/ML | Python 3.9+, PyTorch 2.5, FastAPI 0.115, Scikit-learn, Pandas |
| Database | MySQL 8.0, HikariCP connection pooling |
| DevOps | Docker, GitHub Actions, SonarQube, Vercel |
| Testing | Vitest, JUnit 5, Playwright, fast-check, hypothesis, jqwik |

## Quick Start

### Prerequisites
- Node.js 18+, Python 3.9+, Java 17+, Maven 3.6+, MySQL 8.0+

```bash
# 1. Set MySQL credentials
export MYSQL_PASSWORD=your_password

# 2. Initialize database
./scripts/setup-database.sh

# 3. Start all services
./scripts/start-system.sh
```

### Service Ports

| Service | Port |
|---------|------|
| Frontend | 5173 |
| API Gateway | 8080 |
| AI Service | 8000 |
| Customer Service | 8081 |
| Product Service | 8082 |
| Sales Service | 8083 |
| Analytics Service | 8084 |
| Document Service | 8085 |

```bash
# Stop all services
./scripts/stop-system.sh
```

## Features

- **Real-time Dashboard** — business metrics, sales/cost/profit trends, date filtering
- **AI Forecasting** — PyTorch-based revenue and profit predictions
- **Bilingual Chatbot** — Spanish/English natural language queries
- **CRUD Operations** — products, customers, sales, documents
- **Infinite Scroll Sales** — paginated transaction history

## Development

```bash
# Frontend
cd frontend && npm install && npm run dev

# AI Service
cd ai-service && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && python main.py

# Any Java service
cd <service-name> && ./mvnw spring-boot:run
```

## Testing

```bash
# Frontend
cd frontend && npm run test

# AI Service
cd ai-service && pytest --cov=. --cov-report=xml

# Java service
cd <service-name> && ./mvnw test
```

Coverage requirement: ≥ 80% line coverage across all services.

## Scripts

| Script | Description |
|--------|-------------|
| `scripts/start-system.sh` | Start all services |
| `scripts/stop-system.sh` | Stop all services |
| `scripts/setup-database.sh` | Initialize database |
| `scripts/check-system.sh` | Health check |
| `scripts/build-all.sh` | Build all Java services |

## Environment Variables

```bash
export MYSQL_PASSWORD=your_password       # Required
export MYSQL_USER=root                    # Default: root
export OPENAI_API_KEY=your_key            # Optional
export SONAR_HOST_URL=http://localhost:9000
export SONAR_TOKEN=your_sonar_token
```

## Architecture

Microservices with API Gateway routing. Each service is independently deployable with its own database schema on a shared MySQL instance.

```
main (production) ← staging ← develop ← feature/*
```

Frontend deploys to Vercel. Backend services run in Docker containers.

## Troubleshooting

```bash
# Ports in use
lsof -i :8080,5173,8000

# MySQL not running
brew services restart mysql
mysql -u root -p$MYSQL_PASSWORD -e "SHOW DATABASES;"

# Service logs
tail -f logs/*.log
```

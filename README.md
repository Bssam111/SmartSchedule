# SmartSchedule - Secure Academic Scheduling System

A comprehensive, security-first academic scheduling system built with Node.js, Express, Next.js, and PostgreSQL. Features role-based access control, advanced security measures, and production-ready deployment.

## 🚀 Features

### Core Functionality
- **Academic Scheduling**: Course, section, and schedule management
- **User Management**: Student, faculty, and committee role management
- **Conflict Resolution**: Automated scheduling conflict detection
- **Assignment Management**: Student-course assignment tracking
- **Feedback System**: User feedback and rating collection

### Security Features
- **Role-Based Access Control (RBAC)**: Granular permissions system
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive server-side validation
- **Rate Limiting**: DDoS protection and abuse prevention
- **Security Headers**: CSP, HSTS, and other security headers
- **Audit Logging**: Complete security event tracking
- **Data Encryption**: Sensitive data protection

## 🏗️ Architecture

### Backend (Node.js + Express + TypeScript)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh token rotation
- **Security**: Helmet, CORS, rate limiting, input sanitization
- **Testing**: Vitest with comprehensive security tests

### Frontend (Next.js + React + TypeScript)
- **Framework**: Next.js 15 with React 18
- **Styling**: Tailwind CSS
- **Authentication**: JWT token management
- **State Management**: React hooks and context

### Database (PostgreSQL)
- **ORM**: Prisma with type-safe queries
- **Migrations**: Version-controlled schema changes
- **Security**: Encrypted connections, audit logging
- **Backups**: Automated backup system

## 🔐 Security Implementation

### Authentication & Authorization
- **JWT Tokens**: Short-lived access tokens (15 minutes)
- **Refresh Tokens**: Secure rotation mechanism
- **Role-Based Access**: STUDENT, FACULTY, COMMITTEE roles
- **Permission Matrix**: Resource-action based permissions
- **Audit Logging**: All security events tracked

### Data Protection
- **Input Validation**: Zod schema validation
- **XSS Prevention**: Input sanitization and output encoding
- **SQL Injection**: Parameterized queries via Prisma
- **CSRF Protection**: SameSite cookie attributes
- **Rate Limiting**: Tiered rate limiting system

### Privacy Safeguards
- **Data Minimization**: Only necessary data exposure
- **PII Protection**: Sensitive data masking
- **Encryption**: Data encryption at rest and in transit
- **Retention Policies**: Automatic data cleanup

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/smartschedule.git
   cd smartschedule
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../smart-schedule
   npm install
   ```

3. **Setup environment variables**
   ```bash
   # Copy environment files
   cp backend/env.example backend/.env
   cp smart-schedule/.env.example smart-schedule/.env
   
   # Edit with your configuration
   nano backend/.env
   nano smart-schedule/.env
   ```

4. **Setup database**
   ```bash
   # Start PostgreSQL
   sudo systemctl start postgresql
   
   # Create database
   createdb smartschedule
   
   # Run migrations
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start development servers**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev
   
   # Frontend (Terminal 2)
   cd smart-schedule
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api/health

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Security tests
npm run test:security

# Frontend tests
cd smart-schedule
npm test
```

### Test Coverage
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **Security Tests**: RBAC, validation, and security headers
- **E2E Tests**: Complete user workflow testing

## 🚀 Production Deployment

### GoDaddy VPS Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

**Quick Deployment Steps:**
1. **Setup VPS**: Ubuntu 20.04+ with Docker
2. **Install Dependencies**: Node.js, PostgreSQL, Nginx
3. **Configure SSL**: Let's Encrypt certificates
4. **Deploy Application**: PM2 process management
5. **Security Hardening**: Firewall, fail2ban, monitoring

### Environment Variables

**Required Environment Variables:**
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/smartschedule"

# JWT Security
JWT_SECRET="your-256-bit-secret"
JWT_REFRESH_SECRET="your-256-bit-refresh-secret"

# Server
PORT=3001
NODE_ENV="production"

# Security
FRONTEND_URL="https://yourdomain.com"
ALLOWED_ORIGINS="https://yourdomain.com"
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Current user info

### User Management
- `GET /api/users` - List users (COMMITTEE only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (COMMITTEE only)

### Course Management
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course (COMMITTEE only)
- `PUT /api/courses/:id` - Update course (COMMITTEE only)
- `DELETE /api/courses/:id` - Delete course (COMMITTEE only)

### Schedule Management
- `GET /api/schedules` - List schedules
- `POST /api/schedules` - Create schedule (COMMITTEE only)
- `PUT /api/schedules/:id` - Update schedule (COMMITTEE only)
- `PATCH /api/schedules/:id/publish` - Publish schedule (COMMITTEE only)

## 🔒 Security Documentation

See [SECURITY.md](./SECURITY.md) for comprehensive security documentation including:
- RBAC permission matrix
- Security architecture
- Vulnerability management
- Compliance requirements
- Incident response procedures

## 🛠️ Development

### Project Structure
```
smartschedule/
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── middleware/      # Security middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utilities
│   │   └── tests/          # Test suites
│   ├── prisma/            # Database schema
│   └── package.json
├── smart-schedule/         # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities
│   └── package.json
├── DEPLOYMENT.md          # Deployment guide
├── SECURITY.md           # Security documentation
└── README.md             # This file
```

### Development Commands
```bash
# Backend development
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Lint code
npm run format       # Format code

# Frontend development
cd smart-schedule
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Lint code
```

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# View database
npx prisma studio
```

## 🔧 Configuration

### Security Configuration
- **Rate Limiting**: Configurable per endpoint type
- **CORS**: Strict origin validation
- **Security Headers**: Comprehensive header configuration
- **Input Validation**: Schema-based validation
- **Audit Logging**: Configurable log retention

### Performance Configuration
- **Caching**: Redis integration (optional)
- **Compression**: Gzip compression
- **Database**: Connection pooling
- **Monitoring**: Application performance monitoring

## 📊 Monitoring & Logging

### Application Monitoring
- **Health Checks**: `/api/health` endpoint
- **Performance Metrics**: Response time tracking
- **Error Tracking**: Comprehensive error logging
- **Security Events**: Audit log analysis

### Log Management
- **Structured Logging**: JSON format logs
- **Log Rotation**: Automated log cleanup
- **Security Logs**: Audit trail maintenance
- **Error Tracking**: Exception monitoring

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Security**: Security-first development
- **Testing**: Comprehensive test coverage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Security Issues
For security vulnerabilities, please email security@yourdomain.com

### General Support
- **Documentation**: Check this README and other docs
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions

### Contact
- **Project Lead**: lead@yourdomain.com
- **Security Team**: security@yourdomain.com
- **Technical Support**: support@yourdomain.com

## 🎯 Roadmap

### Upcoming Features
- [ ] Advanced scheduling algorithms
- [ ] Mobile application
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] Multi-tenant support

### Security Enhancements
- [ ] Advanced threat detection
- [ ] Machine learning security
- [ ] Zero-trust architecture
- [ ] Enhanced compliance features

---

**Built with ❤️ and security-first principles**
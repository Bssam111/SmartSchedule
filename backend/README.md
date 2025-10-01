# SmartSchedule Backend API

A modern Node.js + Express + TypeScript backend API for the SmartSchedule academic scheduling system.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with httpOnly cookies
- **Validation**: Zod
- **Testing**: Vitest + Supertest
- **Linting**: ESLint + Prettier
- **CI/CD**: GitHub Actions

## Features

- 🔐 JWT-based authentication with httpOnly cookies
- 👥 Role-based access control (Student, Faculty, Committee)
- 📚 Course and section management
- 🏫 Room and timeslot management
- 📅 Schedule generation and management
- 👨‍🎓 Student enrollment system
- 📊 Faculty assignment tracking
- 🔍 Conflict detection
- 💡 Recommendation system
- 🏥 Health check endpoints
- 🧪 Comprehensive test coverage
- 🔒 Security middleware (Helmet, CORS, Rate limiting)

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/smartschedule"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

4. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# (Optional) Seed the database
npm run db:seed
```

### Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run typecheck` - Run TypeScript type checking
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push database schema
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info

### Core Endpoints

- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course (Faculty/Committee)
- `GET /api/sections` - Get all sections
- `POST /api/sections` - Create section (Faculty/Committee)
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create room (Faculty/Committee)
- `GET /api/timeslots` - Get all time slots
- `POST /api/timeslots/generate` - Generate time slots (Faculty/Committee)

### Student Endpoints

- `GET /api/students` - Get all students
- `GET /api/students/search` - Search students
- `POST /api/enroll` - Enroll in section (Student)

### Faculty Endpoints

- `GET /api/faculty/assignments` - Get faculty assignments
- `GET /api/faculty/availability` - Get faculty availability
- `POST /api/faculty/availability` - Update faculty availability

### System Endpoints

- `GET /api/health` - Health check
- `GET /api/health/db` - Database health check
- `GET /api/conflicts` - Get scheduling conflicts
- `GET /api/recommendations` - Get recommendations
- `POST /api/generate` - Generate schedule (Committee)

## Testing

Run the test suite:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Database Schema

The database schema is defined in `prisma/schema.prisma` and includes:

- Users (Students, Faculty, Committee)
- Courses and Sections
- Rooms and Time Slots
- Assignments and Preferences
- Schedules and Statuses
- Notifications and Feedback

## Security Features

- JWT authentication with httpOnly cookies
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with Zod
- SQL injection protection via Prisma

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

Ensure all required environment variables are set:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRES_IN` - Access token expiration
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration
- `PORT` - Server port
- `NODE_ENV` - Environment (production/development)
- `FRONTEND_URL` - Frontend URL for CORS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

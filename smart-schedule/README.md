# SmartSchedule - Academic Scheduling System

A modern, responsive web application for managing university course schedules with AI-powered recommendations.

## 🚀 Features

- **Role-based Authentication**: Student, Faculty, and Committee dashboards
- **Database Integration**: PostgreSQL with Prisma ORM
- **Responsive UI**: Mobile-first design with Tailwind CSS
- **AI Recommendations**: Smart scheduling suggestions
- **Real-time Updates**: Live schedule management
- **Modern Tech Stack**: Next.js 15, TypeScript, Prisma

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom role-based auth system
- **API**: Next.js API Routes

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/smartschedule"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NODE_ENV="development"
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:setup
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Access the Application
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 👥 User Roles

### Student Dashboard
- View personal schedule
- Set elective preferences
- Submit feedback
- Receive notifications

### Faculty Dashboard
- Manage availability
- View teaching assignments
- Update course information
- Review student feedback

### Committee Dashboard
- Generate schedules
- Review recommendations
- Manage feedback
- Approve final schedules

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks
- `npm run test` - Run tests
- `npm run db:setup` - Setup database with sample data
- `npm run db:push` - Push schema to database
- `npm run db:generate` - Generate Prisma client

## 📁 Project Structure

```
smart-schedule/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── login/             # Login page
│   ├── student/           # Student dashboard
│   ├── faculty/           # Faculty dashboard
│   └── committee/         # Committee dashboard
├── components/            # React components
├── lib/                   # Utility libraries
├── prisma/               # Database schema
├── scripts/              # Database scripts
└── public/               # Static assets
```

## 🔐 Authentication

The application uses a demo authentication system:
- **Email**: Any valid email format
- **Password**: Any password
- **Role**: Select Student, Faculty, or Committee

## 📊 Database Schema

The application includes the following main entities:
- **Users**: Students, Faculty, Committee members
- **Courses**: Academic courses with levels
- **Sections**: Course sections with instructors
- **Schedules**: Generated schedules with versions
- **Assignments**: Student-course assignments
- **Preferences**: User preferences and settings

## 🎨 UI/UX Features

- **Responsive Design**: Works on mobile, tablet, and desktop
- **Modern Interface**: Clean, professional design
- **Role-based Navigation**: Different interfaces per user type
- **Real-time Updates**: Live data updates
- **Accessibility**: WCAG compliant design

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables
Set the following environment variables in production:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_API_URL`: API base URL
- `NODE_ENV`: Set to "production"

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

---

**SmartSchedule** - Making academic scheduling smarter, faster, and more efficient! 🎓✨

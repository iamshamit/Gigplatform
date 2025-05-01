# Gig Platform

A full-stack freelancing platform connecting employers with skilled freelancers.

## Features

- **User Authentication**: Secure signup/login with JWT
- **Job Management**: Post, browse, and apply for jobs
- **Profile System**: User profiles with skills and ratings
- **Messaging**: Real-time chat between employers and freelancers
- **Payment Tracking**: Job payment status and earnings tracking

## Tech Stack

### Frontend
- React 19
- Vite
- React Router
- React Query
- Socket.IO Client
- Tailwind CSS
- Bootstrap

### Backend
- Node.js
- Express
- MongoDB (Atlas)
- Mongoose
- Socket.IO
- JWT Authentication
- Bcrypt Password Hashing

## Project Structure

```
Gig-platform/
├── backend/               # Backend server code
│   ├── models/           # MongoDB models (User, Job, Chat)
│   ├── routes/           # API routes
│   ├── middleware/       # Authentication middleware
│   └── index.js          # Main server entry point
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # React entry point
│   └── vite.config.js    # Vite configuration
└── README.md             # This file
```

## Installation

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)
- Git

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gig-platform.git
cd gig-platform
```

2. Set up backend:
```bash
cd backend
npm install
```

3. Set up frontend:
```bash
cd ../frontend
npm install
```

4. Create `.env` files:
- Backend: `e:\Gig-platform\backend\.env`
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

## Running the Application

1. Start backend server:
```bash
cd backend
npm run dev
```

2. Start frontend development server:
```bash
cd ../frontend
npm run dev
```

The application will be available at:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/signup` | POST | User registration |
| `/auth/login` | POST | User login |
| `/auth/me` | GET | Get current user profile |
| `/jobs` | GET | Get all jobs |
| `/jobs` | POST | Create new job |
| `/chat/:jobId` | GET | Get chat messages |

## Environment Variables

See `.env.example` files in both backend and frontend directories for required environment variables.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

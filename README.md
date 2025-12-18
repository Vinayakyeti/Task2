# Task Management System

A full-stack task management application with real-time collaboration features, built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io.

## Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **Task CRUD Operations**: Create, read, update, and delete tasks
- **Task Assignment**: Assign tasks to team members
- **Real-time Updates**: Live task updates using Socket.io
- **Advanced Filtering**: Filter tasks by status, priority, assignment, and overdue status
- **Sorting**: Sort tasks by due date
- **Authorization**: Role-based access control (only task creators can delete tasks)
- **Form Validation**: Client and server-side validation using Zod
- **Responsive UI**: Mobile-friendly interface with Tailwind CSS
- **Type Safety**: Full TypeScript implementation on both frontend and backend

## Tech Stack

### Backend
- **Node.js** & **Express**: Server framework
- **TypeScript**: Type-safe JavaScript
- **MongoDB** & **Mongoose**: Database and ODM
- **Socket.io**: Real-time bidirectional communication
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing
- **Zod**: Schema validation
- **Jest**: Unit testing

### Frontend
- **React 19**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **React Router**: Client-side routing
- **React Query**: Server state management
- **React Hook Form**: Form handling
- **Axios**: HTTP client
- **Socket.io Client**: Real-time updates

## Architecture

### Backend Architecture

The backend follows a **layered architecture** pattern for separation of concerns:

```
┌─────────────────┐
│   Controllers   │ ← HTTP request/response handling
├─────────────────┤
│    Services     │ ← Business logic
├─────────────────┤
│  Repositories   │ ← Data access layer
├─────────────────┤
│     Models      │ ← Mongoose schemas
└─────────────────┘
```

**Layers:**

1. **Controllers** (`src/controllers/`): Handle HTTP requests, validate input via DTOs, delegate to services
2. **Services** (`src/services/`): Contain business logic, orchestrate data operations
3. **Repositories** (`src/repositories/`): Abstract database queries, provide data access interface
4. **Models** (`src/models/`): Define Mongoose schemas and data structure
5. **DTOs** (`src/dtos/`): Zod schemas for request validation
6. **Middleware** (`src/middleware/`): Authentication, error handling
7. **Utils** (`src/utils/`): Custom error classes, shared utilities

**Benefits:**
- Clear separation of concerns
- Easy to test (unit tests for services)
- Maintainable and scalable
- Dependency injection ready

### Frontend Architecture

The frontend uses a **component-based architecture** with React:

```
┌─────────────────┐
│   Components    │ ← Reusable UI components
├─────────────────┤
│     Pages       │ ← Route-level components
├─────────────────┤
│      Lib        │ ← API client, Socket.io, utilities
└─────────────────┘
```

**Key Patterns:**
- **React Query** for server state management (caching, invalidation, mutations)
- **React Hook Form + Zod** for form validation
- **Custom hooks** for reusable logic
- **Context API** (via React Query) for global state

## Socket.io Implementation

### Real-time Features

The application uses Socket.io for bidirectional real-time communication:

**Connection Flow:**
1. Client connects to server with JWT token in auth payload
2. Server validates token and creates user-specific room
3. Client joins room based on user ID
4. Events are emitted to specific rooms or broadcast to all

**Events:**

| Event | Direction | Purpose | Payload |
|-------|-----------|---------|---------|
| `taskUpdated` | Server → Client | Notify when task is modified | Updated task object |
| `taskAssigned` | Server → Client | Notify when assigned to task | { task, assignedTo } |

**Backend Implementation** (`src/socket.ts`):
- JWT authentication middleware for socket connections
- User-specific rooms for targeted notifications
- Task update broadcasting on status/priority/assignee changes
- Assignment notifications to newly assigned users

**Frontend Implementation** (`src/lib/socket.ts` + `Dashboard.tsx`):
- Manual connection with JWT authentication
- Event listeners for `taskUpdated` and `taskAssigned`
- React Query cache updates on real-time events
- Toast notifications for assignments
- Automatic disconnect on component unmount

**Trade-offs:**
- ✅ **Pros**: Instant updates, better UX, reduced polling
- ⚠️ **Cons**: Additional server overhead, connection management complexity, potential scalability issues at high scale

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | Yes |

**Register/Login Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Tasks

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/tasks` | Get all tasks (filtered by user) | Yes |
| GET | `/api/tasks/:id` | Get single task | Yes |
| POST | `/api/tasks` | Create new task | Yes |
| PUT | `/api/tasks/:id` | Update task | Yes |
| DELETE | `/api/tasks/:id` | Delete task (creator only) | Yes |

**Create Task Request:**
```json
{
  "title": "Implement authentication",
  "description": "Add JWT authentication to API",
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2025-12-31",
  "assignedTo": "507f1f77bcf86cd799439011"
}
```

**Task Response:**
```json
{
  "_id": "507f191e810c19729de860ea",
  "title": "Implement authentication",
  "description": "Add JWT authentication to API",
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2025-12-31T00:00:00.000Z",
  "createdBy": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "assignedTo": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "createdAt": "2025-12-18T10:00:00.000Z",
  "updatedAt": "2025-12-18T10:00:00.000Z"
}
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your_super_secret_jwt_key_change_in_production
NODE_ENV=development
```

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Run the backend server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm run build
npm start
```

6. Run tests:
```bash
npm test
```

The backend server will run on `http://localhost:4000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm run preview
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

### Full Stack Setup (Recommended)

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Then open your browser to `http://localhost:5173`

## Project Structure

```
task-2/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   │   ├── auth.controller.ts
│   │   │   └── task.controller.ts
│   │   ├── services/          # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── task.service.ts
│   │   │   └── task.service.test.ts
│   │   ├── repositories/      # Data access
│   │   │   ├── user.repository.ts
│   │   │   └── task.repository.ts
│   │   ├── models/            # Mongoose schemas
│   │   │   ├── user.model.ts
│   │   │   └── task.model.ts
│   │   ├── dtos/              # Validation schemas
│   │   │   ├── auth.dto.ts
│   │   │   └── task.dto.ts
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── routes/            # API routes
│   │   │   ├── auth.routes.ts
│   │   │   └── task.routes.ts
│   │   ├── utils/             # Utilities
│   │   │   └── errors.ts
│   │   ├── socket.ts          # Socket.io setup
│   │   └── index.ts           # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── SkeletonLoader.tsx
│   │   │   └── TaskForm.tsx
│   │   ├── pages/             # Route components
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── lib/               # Utilities
│   │   │   ├── api.ts         # Axios client
│   │   │   ├── queryClient.ts # React Query config
│   │   │   └── socket.ts      # Socket.io client
│   │   ├── App.tsx            # Root component
│   │   ├── main.tsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

## Design Trade-offs

### 1. Layered Architecture vs. Simple MVC

**Chosen**: Layered (Controllers → Services → Repositories)

**Trade-offs:**
- ✅ **Pros**: Better separation of concerns, easier testing, scalable
- ⚠️ **Cons**: More boilerplate, overkill for simple apps
- **Reasoning**: Worth it for maintainability and testability as the app grows

### 2. React Query vs. Redux

**Chosen**: React Query for server state

**Trade-offs:**
- ✅ **Pros**: Built-in caching, automatic refetching, less boilerplate, optimized for async data
- ⚠️ **Cons**: Additional dependency, learning curve
- **Reasoning**: Server state is 90% of our state; React Query handles it better than Redux

### 3. Socket.io vs. Polling

**Chosen**: Socket.io for real-time updates

**Trade-offs:**
- ✅ **Pros**: Instant updates, better UX, reduced server load vs. aggressive polling
- ⚠️ **Cons**: Persistent connections, scaling complexity (need Redis adapter for multi-server)
- **Reasoning**: Real-time collaboration is core feature; polling would feel sluggish

### 4. Zod for Validation (Both Sides)

**Chosen**: Zod on frontend (React Hook Form) and backend (DTOs)

**Trade-offs:**
- ✅ **Pros**: Type-safe validation, shared schemas possible, better DX
- ⚠️ **Cons**: Bundle size on frontend, could use native HTML5 validation
- **Reasoning**: Type safety and consistent validation logic worth the cost

### 5. JWT in Cookies vs. localStorage

**Chosen**: localStorage (simple approach)

**Trade-offs:**
- ✅ **Pros**: Simple to implement, works well with CORS
- ⚠️ **Cons**: XSS vulnerability if not careful, not httpOnly
- **Reasoning**: For this project scope, acceptable; production would use httpOnly cookies

### 6. MongoDB vs. PostgreSQL

**Chosen**: MongoDB with Mongoose

**Trade-offs:**
- ✅ **Pros**: Flexible schema, fast development, good for iterative design
- ⚠️ **Cons**: No ACID transactions (well, limited), less strict
- **Reasoning**: Tasks are document-like; relationships are simple; Mongo fits well

### 7. TypeScript Everywhere

**Chosen**: Full TypeScript on frontend and backend

**Trade-offs:**
- ✅ **Pros**: Type safety, better IDE support, catch bugs early, self-documenting
- ⚠️ **Cons**: Initial setup time, learning curve, slower iteration in early stages
- **Reasoning**: Worth it for maintainability and confidence in refactoring

## Testing

The backend includes unit tests for critical business logic:

```bash
cd backend
npm test
```

**Test Coverage:**
- Task service CRUD operations
- Authorization logic (creator-only delete)
- Error handling

**Future Improvements:**
- Integration tests for API endpoints
- E2E tests for critical user flows
- Frontend component tests with React Testing Library

## Future Enhancements

- [ ] Task comments and activity log
- [ ] File attachments
- [ ] Email notifications
- [ ] Task templates
- [ ] Team/workspace management
- [ ] Calendar view
- [ ] Search functionality
- [ ] Dark mode
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting

## License

MIT

## Author

Developed as a full-stack task management demonstration project.

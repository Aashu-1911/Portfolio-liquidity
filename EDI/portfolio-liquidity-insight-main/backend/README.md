# Auth Backend (Node + Express + MongoDB)

This backend provides authentication for the React frontend.

## Folder Structure

- src/config: environment and MongoDB connection setup
- src/models: Mongoose models
- src/services: token helpers (JWT)
- src/middleware: auth guard middleware
- src/controllers: request handlers
- src/routes: API routes
- src/app.js: Express app wiring
- src/server.js: startup entrypoint

## API Endpoints

- GET /health
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

## Setup

1. Install dependencies:
   npm install

2. Create `.env` from `.env.example`:
   - PORT=5001
   - MONGO_URI=mongodb://127.0.0.1:27017/portfolio_liquidity_auth
   - JWT_SECRET=<your-secret>
   - JWT_EXPIRES_IN=7d
   - FRONTEND_ORIGIN=http://localhost:8080

3. Run backend:
   npm run dev

## Notes

- Ensure MongoDB is running locally, or replace MONGO_URI with your MongoDB Atlas URI.
- Frontend reads auth API from `VITE_AUTH_API_BASE`.

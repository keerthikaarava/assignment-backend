# Backend Assignment Management System

## 1. Overview

The Backend Assignment Management System is a REST API built using Node.js, Express.js, and PostgreSQL. It provides user authentication, assignment management, timed assignment attempts, answer submission, deadline enforcement, and automatic scoring.

## 2. Features

- Student registration and login
- Password hashing using bcryptjs
- JWT-based authentication
- Student and admin roles
- Admin-only assignment creation
- Assignment listing
- Timed assignment attempts with deadlines
- Answer and submission-link validation
- Automatic scoring based on submission checks
- Attempt status tracking: `in_progress`, `submitted`, `reviewed`, and `timed_out`
- Access control to prevent students from viewing other students' attempts
- PostgreSQL database integration

## 3. Technologies Used

- Node.js
- Express.js
- PostgreSQL
- pg
- bcryptjs
- jsonwebtoken
- dotenv
- Postman
- Visual Studio Code

## 4. Prerequisites

Install the following software before running the project:

- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Postman](https://www.postman.com/)

## 5. Installation

### Step 1: Open the project

Clone the repository or download the project files, then open the `assignment-backend` folder in VS Code.

### Step 2: Install dependencies

Run the following command in the project terminal:

```bash
npm install
```

### Step 3: Create the database

Create a PostgreSQL database named:

```sql
CREATE DATABASE assignment_db;
```

If the database already exists, skip this command.

### Step 4: Create the database tables

Make sure the project contains a file named `schema.sql` with the SQL definitions for the `users`, `assignments`, and `attempts` tables.

Using the PostgreSQL command-line tool, run:

```bash
psql -U postgres -d assignment_db -f schema.sql
```

Enter your PostgreSQL password if prompted.

Alternatively, open pgAdmin, select the `assignment_db` database, open Query Tool, and execute the SQL statements from `schema.sql`.

If the tables already exist, do not execute duplicate table-creation statements without adjusting them first.

## 6. Environment Configuration

Create a `.env` file in the root of the project:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:YOUR_DATABASE_PASSWORD@localhost:5432/assignment_db
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
```

Replace the placeholders with your local PostgreSQL password and a strong, private JWT secret.

**Security:** Never upload your real `.env` file or its secrets to GitHub. The project includes `.gitignore` to exclude `.env` and `node_modules/`.

## 7. Run the Server

Start the development server:

```bash
npm run dev
```

If the development script is not configured, start the server with:

```bash
node server.js
```

The server should run on:

`http://localhost:3000`

To check the database connection, open:

`http://localhost:3000/db-check`

The database check endpoint should report a successful connection when PostgreSQL is configured correctly.

## 8. API Endpoints

Use `http://localhost:3000` as the base URL.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/` | Public | Check the server |
| GET | `/db-check` | Public | Check the database connection |
| POST | `/api/auth/register` | Public | Register a student |
| POST | `/api/auth/login` | Public | Log in and receive a JWT |
| POST | `/api/assignments` | Admin | Create an assignment |
| GET | `/api/assignments` | Authenticated user | List assignments |
| POST | `/api/assignments/:assignmentId/attempts` | Student | Start an assignment attempt |
| POST | `/api/assignments/:assignmentId/attempts/:attemptId/submit` | Student who owns the attempt | Submit an answer and link |
| GET | `/api/attempts/:id` | Owner or admin | View attempt details and results |

## 9. Authentication

Protected endpoints require a JSON Web Token (JWT).

1. Register a student or use an existing account.
2. Log in using the login endpoint.
3. Copy the JWT returned by the login response.
4. In Postman, open the Authorization tab.
5. Select **Bearer Token** and paste the token.
6. Send the protected API request.

Public registration creates student accounts. Admin privileges must be assigned through a trusted administrative process.

## 10. Example API Requests

### A. Register a student

**Method:** `POST`

**URL:** `http://localhost:3000/api/auth/register`

Select Body → raw → JSON in Postman:

```json
{
  "name": "Test Student",
  "email": "student.test@example.com",
  "password": "Student@12345"
}
```

Use a unique email address for each new registration.

### B. Log in

**Method:** `POST`

**URL:** `http://localhost:3000/api/auth/login`

```json
{
  "email": "student.test@example.com",
  "password": "Student@12345"
}
```

Copy the token returned in the response and use it for protected endpoints.

### C. Create an assignment

**Method:** `POST`

**URL:** `http://localhost:3000/api/assignments`

Use an admin JWT under Authorization → Bearer Token.

```json
{
  "title": "Backend API Assignment",
  "description": "Build and test a REST API.",
  "time_limit_minutes": 30
}
```

The authenticated admin is recorded as the assignment creator.

### D. List assignments

**Method:** `GET`

**URL:** `http://localhost:3000/api/assignments`

Use a valid JWT in the Authorization tab.

### E. Start an attempt

**Method:** `POST`

**URL:**

`http://localhost:3000/api/assignments/1/attempts`

Use a student JWT. Replace `1` with the actual assignment ID.

### F. Submit an attempt

**Method:** `POST`

**URL:**

`http://localhost:3000/api/assignments/1/attempts/1/submit`

Use the actual assignment ID and attempt ID returned by your API.

Example request body:

```json
{
  "answer": "This is my assignment answer. It explains the implementation and testing of the REST API, including authentication, validation, database operations, and deadline enforcement.",
  "answer_link": "https://example.com"
}
```

Replace the IDs and example link with appropriate values for your test. The submission must be made before the attempt deadline.

### G. Retrieve attempt details

**Method:** `GET`

**URL:**

`http://localhost:3000/api/attempts/1`

Use the attempt owner's JWT or an admin JWT. Replace `1` with the actual attempt ID.

The response includes the attempt status and, when available, the score and submission checks.

## 11. Testing

Use Postman to test the following scenarios:

1. Register a new student.
2. Log in with valid credentials and obtain a JWT.
3. Verify that invalid login credentials are rejected.
4. Log in as an admin and create an assignment.
5. Verify that a student cannot create an assignment.
6. Start an assignment attempt and verify that its deadline is recorded.
7. Submit an answer and link before the deadline.
8. Verify the submission status, score, and checks.
9. Verify that a student cannot view another student's attempt.
10. Wait until an attempt expires and verify that a late submission is rejected and the attempt is marked `timed_out`.

Save representative Postman requests and responses, or export a Postman collection, to demonstrate the successful and rejected scenarios.

## 12. Database Schema

The project uses three main tables:

- **users:** Stores user details, password hashes, and roles.
- **assignments:** Stores assignment descriptions, time limits, and creator IDs.
- **attempts:** Stores attempt deadlines, answers, submission links, statuses, scores, and checks.

The SQL definitions are provided in `schema.sql`.

## 13. Security Notes

- Passwords are hashed before storage.
- JWTs protect authenticated endpoints.
- Parameterized SQL queries help prevent SQL injection.
- Students are restricted to their own attempts.
- Only trusted administrative processes should assign admin privileges.
- Expired submissions are rejected.
- Environment variables and database credentials must remain private.

## 14. Project Structure

```text
assignment-backend/
├── node_modules/
├── .env
├── .gitignore
├── server.js
├── auth.js
├── assignments.js
├── attempts.js
├── schema.sql
├── package.json
├── package-lock.json
└── README.md
```

Do not commit `.env` or `node_modules/` to GitHub.

## 15. Author

**Name:** keerthika

**Project:** Backend Assignment Management System

**Description:** A REST API for managing users, assignments, timed attempts, submissions, and automatic scoring using Node.js, Express.js, and PostgreSQL.

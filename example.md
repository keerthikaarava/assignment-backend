# Example API Requests (Postman)

This file contains example requests for testing the Assignment Backend Management System using Postman.

## Prerequisites

1. Install dependencies with `npm install`.
2. Configure the environment variables in `.env`, including the database connection and JWT secret.
3. Make sure PostgreSQL is running and the database schema has been created.
4. Start the server with:

```bash
npm start
```

The examples below assume the API is running at `http://localhost:3000`. Adjust the base URL or request fields if your project uses different values.

## 1. Register a student

**Method:** `POST`  
**URL:** `http://localhost:3000/register`

In Postman, select **Body → raw → JSON**:

```json
{
  "name": "Ravi",
  "email": "ravi@test.com",
  "password": "secret123"
}
```

**Expected result:** A successful registration response. Save the student details for the login request.

## 2. Log in as the student

**Method:** `POST`  
**URL:** `http://localhost:3000/login`

**Body → raw → JSON:**

```json
{
  "email": "ravi@test.com",
  "password": "secret123"
}
```

**Expected result:** A successful login response containing a JWT token.

Copy the token from the response. For requests requiring student authentication, open **Authorization → Bearer Token** in Postman and paste the token.

## 3. Register and log in as an admin

Register an admin account if your application permits role selection during registration.

**Method:** `POST`  
**URL:** `http://localhost:3000/register`

**Body → raw → JSON:**

```json
{
  "name": "Admin",
  "email": "admin@test.com",
  "password": "admin123",
  "role": "admin"
}
```

Then log in:

**Method:** `POST`  
**URL:** `http://localhost:3000/login`

**Body → raw → JSON:**

```json
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

Copy the returned JWT token. Use **Authorization → Bearer Token** for the following admin request.

> Security note: In a real deployment, admin accounts should be created or granted admin privileges through a trusted, protected process. Do not expose public self-registration as a way to gain admin access.

## 4. Admin creates an assignment

**Method:** `POST`  
**URL:** `http://localhost:3000/assignments`

**Authorization:** Bearer Token — use the admin token.

**Body → raw → JSON:**

```json
{
  "title": "Write a SQL query",
  "description": "Write a query that returns the top 5 customers by total orders.",
  "time_limit_minutes": 30
}
```

**Expected result:** A successful response containing the created assignment. Note the actual assignment ID returned by the API; use that ID in later requests.

## 5. Student starts the assignment

**Method:** `POST`  
**URL:** `http://localhost:3000/assignments/1/start`

**Authorization:** Bearer Token — use the student token.

Replace `1` with the actual assignment ID returned in Step 4.

**Expected result:** A successful response containing the attempt details. Note the actual attempt ID returned by the API.

## 6. Student submits an answer

**Method:** `POST`  
**URL:** `http://localhost:3000/attempts/1/submit`

**Authorization:** Bearer Token — use the student token.

**Body → raw → JSON:**

```json
{
  "answer": "SELECT customer_id, SUM(total) FROM orders GROUP BY customer_id ORDER BY 2 DESC LIMIT 5;",
  "link": "https://github.com/ravi/sql-work"
}
```

Replace `1` with the actual attempt ID returned in Step 5.

**Expected result:** A successful submission response with the score, according to the project's scoring rules. The project awards up to 3 points based on the answer being non-empty, the answer exceeding 50 characters, and the submitted link passing the project's validation.

## 7. Student views their result

**Method:** `GET`  
**URL:** `http://localhost:3000/attempts/1`

**Authorization:** Bearer Token — use the same student token that owns the attempt.

Replace `1` with the actual attempt ID.

**Expected result:** The student's attempt or result details.

## 8. Another student tries to view the attempt

First register and log in as a different student, then copy that student's token.

**Method:** `GET`  
**URL:** `http://localhost:3000/attempts/1`

**Authorization:** Bearer Token — use the other student's token.

**Expected result:** `404 Not Found` if the API hides attempts belonging to other students. This verifies that a student cannot view another student's attempt.

## 9. Test a submission after the deadline

Start an assignment and wait until its deadline has passed, then submit an answer using the attempt's actual ID.

**Method:** `POST`  
**URL:** `http://localhost:3000/attempts/1/submit`

**Authorization:** Bearer Token — use the owning student's token.

**Body → raw → JSON:**

```json
{
  "answer": "This is a sample answer that is long enough for the answer length validation rule.",
  "link": "https://github.com/ravi/sql-work"
}
```

**Expected result:** The API rejects the late submission with the project's deadline error and marks the attempt as `timed_out`, as implemented by the application.

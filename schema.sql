
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    time_limit_minutes INTEGER NOT NULL
        CHECK (time_limit_minutes > 0),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    assignment_id INTEGER NOT NULL REFERENCES assignments(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deadline TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    answer TEXT,
    answer_link TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN (
            'in_progress', 'submitted', 'reviewed', 'timed_out'
        )),
    score INTEGER CHECK (score BETWEEN 0 AND 3),
    checks JSONB
);

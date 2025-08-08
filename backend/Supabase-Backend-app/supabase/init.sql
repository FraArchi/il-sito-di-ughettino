CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE uploads (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES contacts(id),
    file_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security Policies
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_contacts ON contacts
    FOR SELECT
    USING (auth.uid() = id);

ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_uploads ON uploads
    FOR SELECT
    USING (auth.uid() = user_id);
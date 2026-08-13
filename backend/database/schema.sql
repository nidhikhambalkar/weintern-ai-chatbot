-- ==============================================================================
-- FILE: schema.sql
-- PURPOSE: This SQL script creates the database structure (tables & columns).
-- WHY WE CREATED THIS FILE: PostgreSQL needs instructions on how to store our data.
-- This file defines 4 tables required by Section 12 of the PRD:
-- 1. sessions    -> Stores unique user chat sessions.
-- 2. messages    -> Stores individual chat messages between user and AI bot.
-- 3. leads       -> Stores contact information of prospective students.
-- 4. escalations -> Stores support tickets for human assistance when bot can't answer.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TABLE 1: sessions
-- WHY: We need to know when a chat session started for a user.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    -- id: Unique auto-incrementing number for each row (1, 2, 3...)
    id SERIAL PRIMARY KEY,

    -- session_id: Unique string ID created on frontend (e.g. "session_12345")
    session_id VARCHAR(255) UNIQUE NOT NULL,

    -- created_at: Timestamp when this session was created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index: Speeds up database searches when finding a session by its session_id
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);


-- ------------------------------------------------------------------------------
-- TABLE 2: messages
-- WHY: Stores history of user questions and bot answers so user can view chat log.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    -- id: Unique auto-incrementing ID for every message
    id SERIAL PRIMARY KEY,

    -- session_id: Identifies which chat session this message belongs to
    session_id VARCHAR(255) NOT NULL,

    -- sender: Who sent this message? Only allowed values are 'user', 'bot', or 'system'
    sender VARCHAR(50) NOT NULL CHECK (sender IN ('user', 'bot', 'system')),

    -- message: The actual message text content
    message TEXT NOT NULL,

    -- source: The source of the message (text or voice)
    source VARCHAR(50) DEFAULT 'text',

    -- voice_metadata: Metadata for voice messages (e.g. duration, confidence)
    voice_metadata JSONB DEFAULT NULL,

    -- timestamp: Exact time the message was recorded
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index: Speeds up loading conversation history for a specific session_id
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);


-- ------------------------------------------------------------------------------
-- TABLE 3: leads
-- WHY: When students inquire about internships, we collect their details for marketing.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
    -- id: Unique lead identification number
    id SERIAL PRIMARY KEY,

    -- name: Full name of the student
    name VARCHAR(255) NOT NULL,

    -- email: Student's email address
    email VARCHAR(255) NOT NULL,

    -- phone: Student's phone number
    phone VARCHAR(50) NOT NULL,

    -- preferred_domain: Interested field (e.g., 'Web Development', 'Data Science')
    preferred_domain VARCHAR(255) NOT NULL,

    -- created_at: Time when the lead registered
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index: Allows fast searching by student email
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);


-- ------------------------------------------------------------------------------
-- TABLE 4: escalations
-- WHY: If the AI bot doesn't know an answer, we save a support ticket for humans.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escalations (
    -- id: Unique escalation ticket number
    id SERIAL PRIMARY KEY,

    -- session_id: The chat session where the issue occurred
    session_id VARCHAR(255) NOT NULL,

    -- issue: Description of what the student needs help with
    issue TEXT NOT NULL,

    -- status: Ticket state ('pending', 'in_progress', 'resolved', 'closed')
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),

    -- created_at: Time when ticket was submitted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index: Allows support team to quickly filter tickets by status
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);


-- ------------------------------------------------------------------------------
-- TABLE 5: users
-- WHY: Stores registered user accounts and profiles.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


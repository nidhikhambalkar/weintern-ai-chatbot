// ==============================================================================
// FILE: db.js
// PURPOSE: Connects our backend application to the PostgreSQL database.
// WHY WE CREATED THIS FILE:
// 1. Manages a connection pool so multiple requests can talk to the database safely.
// 2. Automatically creates SQL tables when the server starts up.
// 3. Includes an in-memory fallback mode so the project runs even without local PostgreSQL!
// ==============================================================================

let Pool;
try {
  Pool = require('pg').Pool;
} catch (err) {
  Pool = null;
}

const poolConfig = process.env.DATABASE_URL
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: (process.env.DATABASE_URL.includes("localhost") || process.env.DATABASE_URL.includes("127.0.0.1"))
        ? false 
        : { rejectUnauthorized: false } // Required for remote databases on Railway/Render
    }
  : {
      user: process.env.DB_USER || 'postgres',         // DB username (default: postgres)
      password: process.env.DB_PASSWORD || 'Pooja123#$', // DB password (default: Pooja123#$)
      host: process.env.DB_HOST || 'localhost',         // DB host (default: localhost)
      port: parseInt(process.env.DB_PORT, 10) || 5432, // DB port (default: 5432)
      database: process.env.DB_NAME || 'weintern_chatbot', // Database name
    };

// Initialize PostgreSQL Connection Pool instance if module is available
const pool = Pool ? new Pool({
  ...poolConfig,               // Spread connection configuration object
  connectionTimeoutMillis: 3000 // Timeout after 3 seconds if DB is unreachable
}) : null;


// Variable to track whether PostgreSQL connection is active (true/false)
let isPgConnected = false;

// Fallback in-memory database arrays (used if PostgreSQL is offline)
const inMemoryDb = {
  sessions: [],    // Array to store session objects in RAM
  messages: [],    // Array to store message objects in RAM
  leads: [],       // Array to store lead objects in RAM
  escalations: [], // Array to store escalation ticket objects in RAM
  autoId: {        // Track auto-incrementing IDs for each table
    sessions: 1,
    messages: 1,
    leads: 1,
    escalations: 1
  }
};

// Function: Automatically creates database tables on startup
const initDatabase = async () => {
  // SQL text containing table creation definitions
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      sender VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      source VARCHAR(50) DEFAULT 'text',
      voice_metadata JSONB DEFAULT NULL,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      preferred_domain VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS escalations (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      issue TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    if (!pool) {
      isPgConnected = false;
      console.warn('ℹ️ [Fallback] Running in-memory mode for easy testing without PostgreSQL setup.');
      return;
    }
    // Attempt to acquire a connection client from pool
    const client = await pool.connect();
    // Run the table creation SQL script
    await client.query(schemaSql);
    // Programmatic migrations to alter existing tables
    await client.query(`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'text';
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS voice_metadata JSONB DEFAULT NULL;
    `);
    // Release the client back to pool
    client.release();
    // Mark PostgreSQL connection as active
    isPgConnected = true;
    console.log('✅ [Database] PostgreSQL connected & tables verified successfully.');
  } catch (error) {
    // If connection fails, mark connection as inactive
    isPgConnected = false;
    console.warn('⚠️ [Database] Could not connect to PostgreSQL:', error.message);
    console.warn('ℹ️ [Fallback] Running in-memory mode for easy testing without PostgreSQL setup.');
  }
};

// Function: Executes an SQL query using PostgreSQL pool
const query = async (text, params = []) => {
  if (!isPgConnected && pool) {
    console.log('🔄 [Database] Connection offline. Attempting to reconnect/reinitialize...');
    await initDatabase();
  }
  if (isPgConnected) {
    return await pool.query(text, params); // Run query on real PostgreSQL
  }
  throw new Error('PostgreSQL not connected'); // Throw error to trigger fallback
};

// Export database functions and in-memory object for use in server.js
module.exports = {
  pool,
  query,
  initDatabase,
  getIsPgConnected: () => isPgConnected,
  inMemoryDb
};

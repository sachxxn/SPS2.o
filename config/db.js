// ============================================
// DATABASE CONNECTION FILE
// File: config/db.js
// ============================================

const { Pool } = require('pg');

const PG_URI = process.env.DATABASE_URL || 'postgresql://postgres.xocgimrvevtmxsoqtpws:sachxxn2005.@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
    connectionString: PG_URI,
    ssl: { rejectUnauthorized: false }
});

const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log('================================================');
        console.log('✅  PostgreSQL Connected Successfully (Supabase)!');
        console.log('================================================');

        // Create tables if they do not exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS slots (
                "slotId" VARCHAR(50) PRIMARY KEY,
                "floor" VARCHAR(50),
                "occupied" BOOLEAN DEFAULT false,
                "carNumber" VARCHAR(50) DEFAULT '',
                "mobile" VARCHAR(50) DEFAULT ''
            );
            
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                "carNumber" VARCHAR(50) NOT NULL,
                "mobile" VARCHAR(50) NOT NULL,
                "slot" VARCHAR(50) NOT NULL,
                "slotIndex" INTEGER NOT NULL,
                "bookedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "isActive" BOOLEAN DEFAULT true
            );
            
            CREATE TABLE IF NOT EXISTS history (
                id SERIAL PRIMARY KEY,
                "carNumber" VARCHAR(50),
                "mobile" VARCHAR(50),
                "slot" VARCHAR(50),
                "action" VARCHAR(50),
                "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        client.release();
    } catch (error) {
        console.log('================================================');
        console.error('❌  PostgreSQL Connection FAILED!');
        console.error('🔴  Error    : ' + error.message);
        console.log('------------------------------------------------');
        console.log('================================================');
        process.exit(1);
    }
};

module.exports = { pool, connectDB };

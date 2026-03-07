const mongoose = require('mongoose');
const { Pool } = require('pg');

const Slot = require('./models/Slot');
const Booking = require('./models/Booking');
const History = require('./models/History');

const MONGO_URI = 'mongodb://localhost:27017/smartparking';
const PG_URI = 'postgresql://postgres.xocgimrvevtmxsoqtpws:sachxxn2005.@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString: PG_URI,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    // 1. Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    // 2. Connect to PostgreSQL
    console.log('Connecting to PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected');

    // 3. Create tables
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
    console.log('✅ PostgreSQL tables created');

    // 4. Migrate Slots
    const slots = await Slot.find();
    for (const s of slots) {
      await client.query(`
        INSERT INTO slots ("slotId", "floor", "occupied", "carNumber", "mobile")
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT ("slotId") DO UPDATE 
        SET "occupied" = EXCLUDED."occupied",
            "carNumber" = EXCLUDED."carNumber",
            "mobile" = EXCLUDED."mobile";
      `, [s.slotId, s.floor, s.occupied, s.carNumber, s.mobile]);
    }
    console.log(`✅ Migrated ${slots.length} slots`);

    // 5. Migrate Bookings
    const bookings = await Booking.find();
    for (const b of bookings) {
      await client.query(`
        INSERT INTO bookings ("carNumber", "mobile", "slot", "slotIndex", "bookedAt", "isActive")
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [b.carNumber, b.mobile, b.slot, b.slotIndex, b.bookedAt, b.isActive]);
    }
    console.log(`✅ Migrated ${bookings.length} bookings`);

    // 6. Migrate History
    const history = await History.find();
    for (const h of history) {
      await client.query(`
        INSERT INTO history ("carNumber", "mobile", "slot", "action", "timestamp")
        VALUES ($1, $2, $3, $4, $5)
      `, [h.carNumber, h.mobile, h.slot, h.action, h.timestamp]);
    }
    console.log(`✅ Migrated ${history.length} history records`);

    client.release();
    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();

import { pool } from './db.js';

async function clearFuneralRecords() {
  try {
    const res = await pool.query(`
      DELETE FROM aics_applications 
      WHERE LOWER(service_name) LIKE '%funeral%' 
         OR LOWER(service_name) LIKE '%burial%'
         OR LOWER(category) LIKE '%funeral%'
         OR LOWER(category) LIKE '%burial%'
         OR LOWER(assistance_type) LIKE '%funeral%'
         OR LOWER(assistance_type) LIKE '%burial%'
    `);
    console.log(`Successfully deleted ${res.rowCount} Funeral Assistance records from database.`);
    process.exit(0);
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
}

clearFuneralRecords();

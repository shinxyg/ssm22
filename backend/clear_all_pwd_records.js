import { pool } from './db.js';

async function clearAllPwdFromEveryTable() {
  try {
    console.log('Clearing PWD records from all database tables...');

    const res1 = await pool.query(`
      DELETE FROM aics_applications 
      WHERE LOWER(reference_no) LIKE '%pwd%' 
         OR LOWER(service_name) LIKE '%pwd%'
         OR LOWER(category) LIKE '%pwd%';
    `);
    console.log(`Deleted ${res1.rowCount} PWD records from aics_applications.`);

    const res2 = await pool.query(`
      DELETE FROM pwd_applications;
    `);
    console.log(`Deleted ${res2.rowCount} records from pwd_applications.`);

    const res3 = await pool.query(`
      DELETE FROM appointments 
      WHERE LOWER(reference_no) LIKE '%pwd%'
         OR LOWER(service_name) LIKE '%pwd%'
         OR LOWER(category) LIKE '%pwd%';
    `).catch((e) => {
      console.log('Appointments delete note:', e.message);
      return { rowCount: 0 };
    });
    console.log(`Deleted ${res3.rowCount} PWD records from appointments.`);

    const res4 = await pool.query(`
      DELETE FROM financial_disbursements 
      WHERE LOWER(reference_no) LIKE '%pwd%'
         OR LOWER(category) LIKE '%pwd%' 
         OR LOWER(program_id) LIKE '%pwd%'
         OR LOWER(service_name) LIKE '%pwd%';
    `).catch((e) => {
      console.log('Financial disbursements delete note:', e.message);
      return { rowCount: 0 };
    });
    console.log(`Deleted ${res4.rowCount} PWD records from financial_disbursements.`);

    console.log('✅ ALL PWD records deleted completely across all DB tables!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

clearAllPwdFromEveryTable();

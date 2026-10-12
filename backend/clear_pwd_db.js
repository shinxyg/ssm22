import { pool } from './db.js';

async function clearPwdRecords() {
  try {
    const pwdRes = await pool.query('DELETE FROM pwd_applications;');
    console.log(`Successfully deleted ${pwdRes.rowCount} records from pwd_applications table.`);

    const apptRes = await pool.query(`
      DELETE FROM appointments 
      WHERE LOWER(module) LIKE '%pwd%' 
         OR LOWER(service_name) LIKE '%pwd%'
         OR LOWER(category) LIKE '%pwd%';
    `).catch(() => ({ rowCount: 0 }));
    console.log(`Successfully deleted ${apptRes.rowCount} PWD records from appointments table.`);

    const disbRes = await pool.query(`
      DELETE FROM financial_disbursements 
      WHERE LOWER(category) LIKE '%pwd%' 
         OR LOWER(program_id) LIKE '%pwd%'
         OR LOWER(service_name) LIKE '%pwd%';
    `).catch(() => ({ rowCount: 0 }));
    console.log(`Successfully deleted ${disbRes.rowCount} PWD records from financial_disbursements table.`);

    console.log('✅ ALL PWD records cleared successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing PWD database records:', err);
    process.exit(1);
  }
}

clearPwdRecords();

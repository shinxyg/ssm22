import pg from 'pg';
import dotenv from 'dotenv';
import { initDB, pool } from './db.js';

dotenv.config();

async function resetAllTables() {
  try {
    await initDB();
    const client = await pool.connect();

    console.log('--- Current Data Counts Before Deletion ---');
    const tables = [
      'aics_applications',
      'pwd_applications',
      'senior_applications',
      'solo_parent_applications',
      'educational_applications',
      'child_welfare_applications',
      'livelihood_applications',
      'training_applications',
      'appointments',
      'financial_disbursements',
      'activity_logs',
      'beneficiary_verifications'
    ];

    for (const tbl of tables) {
      try {
        const countRes = await client.query(`SELECT COUNT(*) FROM ${tbl};`);
        console.log(`  • ${tbl}: ${countRes.rows[0].count} records`);
      } catch (e) {
        console.log(`  • ${tbl}: (table does not exist or error: ${e.message})`);
      }
    }

    console.log('\n🧹 Deleting all application records from every module in PostgreSQL database...');

    for (const tbl of tables) {
      try {
        await client.query(`DELETE FROM ${tbl};`);
        console.log(`  ✓ Cleared ${tbl}`);
      } catch (e) {
        console.warn(`  ⚠️ Could not clear ${tbl}:`, e.message);
      }
    }

    // Reset user lockout and failed attempts if any so login is clean
    await client.query(`
      UPDATE users 
      SET failed_login_attempts = 0, 
          lockout_stage = 0, 
          lockout_until = NULL, 
          unlock_otp = NULL, 
          unlock_otp_expires = NULL, 
          last_failed_attempt = NULL;
    `);
    console.log('  ✓ Cleaned all user account lockouts & failed login attempts');

    console.log('\n--- Data Counts After Deletion ---');
    for (const tbl of tables) {
      try {
        const countRes = await client.query(`SELECT COUNT(*) FROM ${tbl};`);
        console.log(`  • ${tbl}: ${countRes.rows[0].count} records`);
      } catch (e) {
        // ignore
      }
    }

    console.log('\n✨ Database is now completely clean and ready for fresh re-applications across all modules!');
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting database:', err);
    process.exit(1);
  }
}

resetAllTables();

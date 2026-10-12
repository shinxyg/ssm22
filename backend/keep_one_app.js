import { pool } from './db.js';

async function keepOnlyOne() {
  try {
    const res = await pool.query('SELECT id, reference_no FROM educational_applications ORDER BY date_submitted DESC');
    console.log('Current Educational Apps:', res.rows);
    if (res.rows.length > 1) {
      const keepId = res.rows[0].id;
      await pool.query('DELETE FROM educational_applications WHERE id != $1', [keepId]);
      console.log(`✅ Kept 1 application (Ref: ${res.rows[0].reference_no}) and deleted remaining duplicates.`);
    }

    const resSolo = await pool.query('SELECT id, reference_no FROM solo_parent_applications ORDER BY date_submitted DESC');
    console.log('Current Solo Parent Apps:', resSolo.rows);
    if (resSolo.rows.length > 1) {
      const keepSoloId = resSolo.rows[0].id;
      await pool.query('DELETE FROM solo_parent_applications WHERE id != $1', [keepSoloId]);
      console.log(`✅ Kept 1 solo parent application (Ref: ${resSolo.rows[0].reference_no}) and deleted remaining duplicates.`);
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error keeping single application:', err);
    process.exit(1);
  }
}

keepOnlyOne();

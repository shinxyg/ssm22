import pg from 'pg';
import dotenv from 'dotenv';
import { initDB, pool } from './db.js';

dotenv.config();

async function insertDirectRecord() {
  try {
    await initDB();
    const client = await pool.connect();

    // Sample 1x1 SVG photo data URL
    const samplePhotoDataUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><rect x="20" y="20" width="360" height="260" rx="15" fill="%231e293b" stroke="%233b82f6" stroke-width="4"/><text x="200" y="100" font-family="sans-serif" font-size="20" font-weight="bold" fill="%2360a5fa" text-anchor="middle">QUEZON CITY MEDICAL CERTIFICATE</text><text x="200" y="140" font-family="sans-serif" font-size="14" fill="%23f8fafc" text-anchor="middle">Patient: JEFFERSON FERNANDO LEE</text><text x="200" y="170" font-family="sans-serif" font-size="12" fill="%2394a3b8" text-anchor="middle">Diagnosis: Medical Assistance Request</text><text x="200" y="200" font-family="sans-serif" font-size="12" fill="%2334d399" text-anchor="middle">✓ VERIFIED BY QCGH ATTENDING PHYSICIAN</text><circle cx="340" cy="240" r="25" fill="%23059669"/><text x="340" y="244" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23ffffff" text-anchor="middle">PASSED</text></svg>';

    const refNo = `QC-AICS-2026-MED-${Math.floor(1000 + Math.random() * 9000)}`;

    const detailsObj = {
      category: 'AICS Assistance Services',
      assistanceType: 'Medicines / Medical Supplies',
      hospitalFacility: 'Quezon City General Hospital (QCGH)',
      medicalCondition: 'Hypertension & Maintenance Medication Request',

      // Step 2 Applicant
      qcId: '110000262304143',
      applicantName: 'JEFFERSON FERNANDO LEE',
      firstName: 'JEFFERSON',
      middleName: 'FERNANDO',
      lastName: 'LEE',
      suffix: '',
      nationality: 'FILIPINO',
      dob: '2004-09-27',
      age: '22',
      gender: 'Male',
      civilStatus: 'Single',
      houseNo: '176',
      street: '23',
      barangay: 'Bagong Silangan',
      fullAddress: '176, 23, Brgy. Bagong Silangan, Quezon City',
      phone: '09155582122',

      // Step 2 Patient
      isApplicantPatient: true,
      patientRelation: 'Self',
      patientName: 'JEFFERSON FERNANDO LEE',
      patientFirstName: 'JEFFERSON',
      patientMiddleName: 'FERNANDO',
      patientLastName: 'LEE',
      patientSuffix: '',
      patientGender: 'Male',
      patientDob: '2004-09-27',
      patientAge: '22',
      patientHouseNo: '176',
      patientStreet: '23',
      patientBarangay: 'Bagong Silangan',
      patientAddress: '176, 23, Brgy. Bagong Silangan, Quezon City',

      // Step 3 Uploaded Photos / Documents Data
      uploadedFiles: ['Medical Certificate', 'Doctor Prescription', 'Indigency Certificate', 'Patient QC ID', 'Authorization Letter'],
      uploadedDocData: {
        med_cert: {
          name: 'medical_certificate_qcgh.jpg',
          size: '850.4 KB',
          type: 'image/jpeg',
          dataUrl: samplePhotoDataUrl
        },
        reseta: {
          name: 'doctor_prescription_2026.jpg',
          size: '1.2 MB',
          type: 'image/jpeg',
          dataUrl: samplePhotoDataUrl
        },
        indigency: {
          name: 'brgy_indigency_bagong_silangan.jpg',
          size: '920.0 KB',
          type: 'image/jpeg',
          dataUrl: samplePhotoDataUrl
        },
        qcid_patient: {
          name: 'qcid_front_photo.jpg',
          size: '1.1 MB',
          type: 'image/jpeg',
          dataUrl: samplePhotoDataUrl
        },
        authorization: {
          name: 'authorization_letter_signed.jpg',
          size: '650.0 KB',
          type: 'image/jpeg',
          dataUrl: samplePhotoDataUrl
        }
      }
    };

    const query = `
      INSERT INTO aics_applications (
        reference_no, applicant_name, first_name, middle_name, last_name, suffix,
        nationality, dob, age, gender, civil_status, house_no, street_name, barangay, phone_number,
        is_patient_self, patient_relationship, patient_first_name, patient_middle_name, patient_last_name,
        patient_suffix, patient_gender, patient_dob, patient_age, patient_house_no, patient_street_name, patient_barangay,
        service_name, category, assistance_type, hospital_facility, medical_condition,
        status, assigned_social_worker, benefit_document_type, details
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27,
        $28, $29, $30, $31, $32,
        $33, $34, $35, $36
      ) RETURNING *;
    `;

    const values = [
      refNo,
      'JEFFERSON FERNANDO LEE',
      'JEFFERSON',
      'FERNANDO',
      'LEE',
      '',
      'FILIPINO',
      '2004-09-27',
      '22',
      'Male',
      'Single',
      '176',
      '23',
      'Bagong Silangan',
      '09155582122',
      true,
      'Self',
      'JEFFERSON',
      'FERNANDO',
      'LEE',
      '',
      'Male',
      '2004-09-27',
      '22',
      '176',
      '23',
      'Bagong Silangan',
      'QC Medical Assistance — Medicines / Supplies',
      'AICS',
      'Medicines / Medical Supplies',
      'Quezon City General Hospital (QCGH)',
      'Hypertension & Maintenance Medication Request',
      'Under Review',
      'Social Worker Maria Santos, RSW (QC CSWDO)',
      'Medicine Gift Certificate / Pharmacy Voucher',
      JSON.stringify(detailsObj)
    ];

    const res = await client.query(query, values);
    console.log(`✅ Successfully inserted direct PostgreSQL record with ref: ${res.rows[0].reference_no}`);

    const countRes = await client.query('SELECT COUNT(*) FROM aics_applications;');
    console.log(`📊 Current total PostgreSQL DB applications: ${countRes.rows[0].count}`);

    client.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error inserting DB record:', err);
    process.exit(1);
  }
}

insertDirectRecord();

import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;

const isInternalOrLocal = (url) => !url || url.includes('localhost') || url.includes('.internal');

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isInternalOrLocal(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false }
    }
  : {
      user: process.env.DB_USER || process.env.PGUSER || 'postgres',
      host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
      database: process.env.DB_NAME || process.env.PGDATABASE || 'govserve_db',
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
      ssl: (process.env.PGHOST && !process.env.PGHOST.includes('localhost') && !process.env.PGHOST.includes('.internal'))
        ? { rejectUnauthorized: false }
        : false
    };

export const pool = new Pool(poolConfig);

// Helper function to test DB connection and initialize tables
export const initDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database successfully!');

    // Initialize core tables matching Step 2 Personal Information & Patient Details
    await client.query(`
      CREATE TABLE IF NOT EXISTS aics_applications (
        id SERIAL PRIMARY KEY,
        reference_no VARCHAR(50) UNIQUE NOT NULL,
        applicant_name VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        middle_name VARCHAR(100),
        last_name VARCHAR(100),
        suffix VARCHAR(20),
        nationality VARCHAR(50) DEFAULT 'FILIPINO',
        dob VARCHAR(50),
        age VARCHAR(10),
        gender VARCHAR(20),
        civil_status VARCHAR(50),
        house_no VARCHAR(100),
        street_name VARCHAR(150),
        barangay VARCHAR(150),
        phone_number VARCHAR(50),
        
        -- Patient Beneficiary Fields (Step 2)
        is_patient_self BOOLEAN DEFAULT TRUE,
        patient_relationship VARCHAR(100),
        patient_first_name VARCHAR(100),
        patient_middle_name VARCHAR(100),
        patient_last_name VARCHAR(100),
        patient_suffix VARCHAR(20),
        patient_gender VARCHAR(20),
        patient_dob VARCHAR(50),
        patient_age VARCHAR(10),
        patient_house_no VARCHAR(100),
        patient_street_name VARCHAR(150),
        patient_barangay VARCHAR(150),

        -- Service & Status Fields
        service_name VARCHAR(255) NOT NULL,
        category VARCHAR(50) DEFAULT 'AICS',
        assistance_type VARCHAR(100),
        hospital_facility VARCHAR(255),
        medical_condition TEXT,
        status VARCHAR(100) DEFAULT 'Under Review',
        assigned_social_worker VARCHAR(255),
        benefit_document_type VARCHAR(255) DEFAULT 'Hospital Guarantee Letter (GL)',
        details JSONB,
        date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS suffix VARCHAR(20);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS dob VARCHAR(50);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS age VARCHAR(10);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS house_no VARCHAR(100);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS street_name VARCHAR(150);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS barangay VARCHAR(150);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS email_address VARCHAR(255);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS nationality VARCHAR(50) DEFAULT 'FILIPINO';
      
      -- Funeral Assistance Explicit DB Columns (Step 1 & Step 2)
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS deceased_date_of_death VARCHAR(50);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS deceased_cremation_or_burial VARCHAR(50);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS deceased_place_of_death TEXT;
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS deceased_date_of_burial VARCHAR(50);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS burial_location_site TEXT;
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS cremation_location_site TEXT;
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS funeral_district VARCHAR(50);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS funeral_home_name VARCHAR(255);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS initial_funeral_choice VARCHAR(255);
      
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS scheduled_payout_date VARCHAR(50);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS scheduled_payout_time VARCHAR(50);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS appointment_date VARCHAR(50);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS appointment_time VARCHAR(50);
      
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS details JSONB;

      DROP TABLE IF EXISTS aics_documents CASCADE;

      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        reference_no VARCHAR(50) UNIQUE NOT NULL,
        module_name VARCHAR(100) NOT NULL,
        applicant_name VARCHAR(255) NOT NULL,
        appointment_date VARCHAR(50),
        appointment_time VARCHAR(50),
        venue VARCHAR(255),
        purpose VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Pending Schedule',
        social_worker_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE appointments ALTER COLUMN appointment_date DROP NOT NULL;
      ALTER TABLE appointments ALTER COLUMN appointment_time DROP NOT NULL;
      ALTER TABLE appointments ALTER COLUMN venue DROP NOT NULL;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'appointments_reference_no_key'
        ) THEN
          ALTER TABLE appointments ADD CONSTRAINT appointments_reference_no_key UNIQUE (reference_no);
        END IF;
      EXCEPTION
        WHEN OTHERS THEN NULL;
      END $$;

      CREATE TABLE IF NOT EXISTS pwd_applications (
        id SERIAL PRIMARY KEY,
        reference_no VARCHAR(50) UNIQUE NOT NULL,
        applicant_name VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        middle_name VARCHAR(100),
        last_name VARCHAR(100),
        suffix VARCHAR(20),
        nationality VARCHAR(50) DEFAULT 'FILIPINO',
        dob VARCHAR(50),
        age VARCHAR(10),
        gender VARCHAR(20),
        civil_status VARCHAR(50),
        house_no VARCHAR(100),
        street_name VARCHAR(150),
        barangay VARCHAR(150),
        phone_number VARCHAR(50),
        pwd_id_no VARCHAR(50),
        employment_status VARCHAR(100),
        occupation VARCHAR(255),
        source_of_income VARCHAR(255),
        approx_monthly_income VARCHAR(100),
        educational_attainment VARCHAR(150),
        other_education_info TEXT,
        family_members JSONB,
        monthly_expenses VARCHAR(100),
        disability_type VARCHAR(150),
        swa_qualifying_category VARCHAR(150),
        reason_for_assistance TEXT,
        uploaded_documents JSONB,
        service_name VARCHAR(255) DEFAULT 'PWD Social Assistance Program',
        category VARCHAR(50) DEFAULT 'pwd',
        assistance_type VARCHAR(100) DEFAULT 'PWD Social Aid',
        amount NUMERIC(10,2) DEFAULT 5000.00,
        status VARCHAR(100) DEFAULT 'Pending Review',
        disapproval_reason TEXT,
        appointment_date VARCHAR(50),
        appointment_time VARCHAR(50),
        appointment_venue VARCHAR(255),
        payout_date VARCHAR(50),
        payout_time VARCHAR(50),
        payout_venue VARCHAR(255),
        details JSONB,
        date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS suffix VARCHAR(20);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS nationality VARCHAR(50) DEFAULT 'FILIPINO';
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS dob VARCHAR(50);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS age VARCHAR(10);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS house_no VARCHAR(100);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS street_name VARCHAR(150);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS pwd_id_no VARCHAR(50);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS employment_status VARCHAR(100);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS occupation VARCHAR(255);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS source_of_income VARCHAR(255);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS approx_monthly_income VARCHAR(100);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS educational_attainment VARCHAR(150);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS other_education_info TEXT;
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS family_members JSONB;
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS monthly_expenses VARCHAR(100);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS swa_qualifying_category VARCHAR(150);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS reason_for_assistance TEXT;
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS uploaded_documents JSONB;
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS service_name VARCHAR(255) DEFAULT 'PWD Social Assistance Program';
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'pwd';
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS assistance_type VARCHAR(100) DEFAULT 'PWD Social Aid';
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2) DEFAULT 5000.00;
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS disapproval_reason TEXT;
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS appointment_date VARCHAR(50);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS appointment_time VARCHAR(50);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS appointment_venue VARCHAR(255);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS payout_date VARCHAR(50);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS payout_time VARCHAR(50);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS payout_venue VARCHAR(255);
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS details JSONB;
      ALTER TABLE pwd_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      CREATE TABLE IF NOT EXISTS senior_applications (
        id SERIAL PRIMARY KEY,
        reference_no VARCHAR(50) UNIQUE NOT NULL,
        applicant_name VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        middle_name VARCHAR(100),
        last_name VARCHAR(100),
        suffix VARCHAR(20),
        dob VARCHAR(50),
        age VARCHAR(10),
        gender VARCHAR(20),
        civil_status VARCHAR(50),
        house_no VARCHAR(100),
        street_name VARCHAR(150),
        barangay VARCHAR(150),
        phone_number VARCHAR(50),
        senior_id_no VARCHAR(50),
        employment_status VARCHAR(100),
        occupation VARCHAR(255),
        source_of_income VARCHAR(255),
        approx_monthly_income VARCHAR(100),
        pension_received VARCHAR(100),
        pension_details VARCHAR(255),
        total_monthly_expenses VARCHAR(100),
        living_arrangement VARCHAR(100),
        custom_living_arrangement VARCHAR(255),
        financial_support_source VARCHAR(100),
        custom_financial_support VARCHAR(255),
        reason_for_assistance VARCHAR(100),
        custom_reason_for_assistance VARCHAR(255),
        other_benefits_received VARCHAR(100),
        custom_other_benefit VARCHAR(255),
        service_name VARCHAR(255) DEFAULT 'Senior Citizen Financial Assistance',
        category VARCHAR(50) DEFAULT 'Senior Assistance',
        assistance_type VARCHAR(100) DEFAULT 'Senior Cash Grant',
        amount NUMERIC(10,2) DEFAULT 3000.00,
        status VARCHAR(100) DEFAULT 'Pending Validation',
        disapproval_reason TEXT,
        appointment_date VARCHAR(50),
        appointment_day VARCHAR(50),
        appointment_time VARCHAR(50),
        appointment_venue VARCHAR(255),
        payout_date VARCHAR(50),
        payout_day VARCHAR(50),
        payout_time VARCHAR(50),
        payout_venue VARCHAR(255),
        details JSONB,
        date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS suffix VARCHAR(20);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS dob VARCHAR(50);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS age VARCHAR(10);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS house_no VARCHAR(100);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS street_name VARCHAR(150);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS barangay VARCHAR(150);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS senior_id_no VARCHAR(50);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS employment_status VARCHAR(100);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS occupation VARCHAR(255);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS source_of_income VARCHAR(255);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS approx_monthly_income VARCHAR(100);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS pension_received VARCHAR(100);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS pension_details VARCHAR(255);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS total_monthly_expenses VARCHAR(100);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS living_arrangement VARCHAR(100);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS custom_living_arrangement VARCHAR(255);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS financial_support_source VARCHAR(100);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS custom_financial_support VARCHAR(255);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS reason_for_assistance VARCHAR(100);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS custom_reason_for_assistance VARCHAR(255);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS other_benefits_received VARCHAR(100);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS custom_other_benefit VARCHAR(255);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS service_name VARCHAR(255) DEFAULT 'Senior Citizen Financial Assistance';
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Senior Assistance';
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS assistance_type VARCHAR(100) DEFAULT 'Senior Cash Grant';
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2) DEFAULT 3000.00;
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS status VARCHAR(100) DEFAULT 'Pending Validation';
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS disapproval_reason TEXT;
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS appointment_date VARCHAR(50);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS appointment_day VARCHAR(50);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS appointment_time VARCHAR(50);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS appointment_venue VARCHAR(255);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS payout_date VARCHAR(50);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS payout_day VARCHAR(50);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS payout_time VARCHAR(50);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS payout_venue VARCHAR(255);
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS details JSONB;
      ALTER TABLE senior_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      CREATE TABLE IF NOT EXISTS livelihood_applications (
        id SERIAL PRIMARY KEY,
        reference_no VARCHAR(50) UNIQUE NOT NULL,
        applicant_name VARCHAR(255) NOT NULL,
        program_name VARCHAR(255) NOT NULL,
        proposal_title VARCHAR(255),
        barangay VARCHAR(150),
        phone_number VARCHAR(50),
        status VARCHAR(100) DEFAULT 'Pending Validation',
        date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Ensure livelihood_applications has all standard columns
      ALTER TABLE livelihood_applications ALTER COLUMN program_name DROP NOT NULL;
      ALTER TABLE livelihood_applications ALTER COLUMN program_name SET DEFAULT 'Livelihood Assistance Program';
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS email_address VARCHAR(255);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS sector VARCHAR(100);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS employment_status VARCHAR(100);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS has_existing_business VARCHAR(10);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS type_of_business VARCHAR(150);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS specified_other_business VARCHAR(255);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS qc_id_no VARCHAR(50);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS suffix VARCHAR(20);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS nationality VARCHAR(50) DEFAULT 'FILIPINO';
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS dob VARCHAR(50);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS age VARCHAR(10);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS blood_type VARCHAR(20);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS house_no VARCHAR(100);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS street_name VARCHAR(150);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS reason_for_assistance TEXT;
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS requested_materials_items JSONB;
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS service_name VARCHAR(255) DEFAULT 'Livelihood Capital Assistance Grant';
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'livelihood';
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS assistance_type VARCHAR(100) DEFAULT 'Livelihood Assistance Grant';
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2) DEFAULT 15000.00;
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS disapproval_reason TEXT;
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS appointment_date VARCHAR(50);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS appointment_time VARCHAR(50);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS appointment_venue VARCHAR(255);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS payout_date VARCHAR(50);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS payout_time VARCHAR(50);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS payout_venue VARCHAR(255);
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS uploaded_documents JSONB;
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS details JSONB;
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS child_full_name VARCHAR(255);
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS child_age VARCHAR(10);
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS child_dob VARCHAR(50);
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS child_sex VARCHAR(20);
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS school_name VARCHAR(255);
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS grade_level VARCHAR(100);
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS lrn_number VARCHAR(50);
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS school_address TEXT;

      CREATE TABLE IF NOT EXISTS solo_parent_applications (
        id SERIAL PRIMARY KEY,
        reference_no VARCHAR(50) UNIQUE NOT NULL,
        applicant_name VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        middle_name VARCHAR(100),
        last_name VARCHAR(100),
        suffix VARCHAR(20),
        nationality VARCHAR(50) DEFAULT 'FILIPINO',
        dob VARCHAR(50),
        age VARCHAR(10),
        gender VARCHAR(20),
        civil_status VARCHAR(50),
        house_no VARCHAR(100),
        street_name VARCHAR(150),
        barangay VARCHAR(150),
        phone_number VARCHAR(50),
        email_address VARCHAR(255),
        solo_parent_id_no VARCHAR(50),
        solo_parent_status VARCHAR(100),
        solo_parent_category VARCHAR(100),
        child_full_name VARCHAR(255),
        child_age VARCHAR(10),
        child_dob VARCHAR(50),
        child_sex VARCHAR(20),
        school_name VARCHAR(255),
        grade_level VARCHAR(100),
        lrn_number VARCHAR(50),
        school_address TEXT,
        num_dependents VARCHAR(10),
        age_youngest_dependent VARCHAR(10),
        employment_status VARCHAR(100),
        occupation VARCHAR(255),
        employer_income_source VARCHAR(255),
        monthly_income VARCHAR(100),
        receiving_gov_assistance VARCHAR(100),
        gov_program_name VARCHAR(255),
        gov_assistance_amount_freq VARCHAR(255),
        receiving_pension VARCHAR(100),
        pension_type VARCHAR(255),
        service_name VARCHAR(255) DEFAULT 'Solo Parent Financial Subsidy Program',
        category VARCHAR(50) DEFAULT 'soloparent',
        assistance_type VARCHAR(100) DEFAULT 'Solo Parent Welfare Grant',
        amount NUMERIC(10,2) DEFAULT 3000.00,
        status VARCHAR(100) DEFAULT 'Pending Document Validation',
        disapproval_reason TEXT,
        appointment_date VARCHAR(50),
        appointment_time VARCHAR(50),
        appointment_venue VARCHAR(255),
        payout_date VARCHAR(50),
        payout_time VARCHAR(50),
        payout_venue VARCHAR(255),
        uploaded_documents JSONB,
        details JSONB,
        date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS financial_disbursements (
        id SERIAL PRIMARY KEY,
        reference_no VARCHAR(50) UNIQUE NOT NULL,
        applicant_name VARCHAR(255) NOT NULL,
        module_name VARCHAR(100) DEFAULT 'SOLO PARENT',
        benefit_name VARCHAR(255) DEFAULT 'Solo Parent Cash Subsidy',
        amount NUMERIC(10,2) DEFAULT 3000.00,
        payout_date VARCHAR(50),
        payout_start_time VARCHAR(50),
        payout_end_time VARCHAR(50),
        venue VARCHAR(255),
        status VARCHAR(100) DEFAULT 'PAYOUT SCHEDULED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS educational_applications (
        id SERIAL PRIMARY KEY,
        reference_no VARCHAR(50) UNIQUE NOT NULL,
        applicant_name VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        middle_name VARCHAR(100),
        last_name VARCHAR(100),
        suffix VARCHAR(20),
        nationality VARCHAR(50) DEFAULT 'FILIPINO',
        dob VARCHAR(50),
        age VARCHAR(10),
        gender VARCHAR(20),
        civil_status VARCHAR(50),
        house_no VARCHAR(100),
        street_name VARCHAR(150),
        barangay VARCHAR(150),
        phone_number VARCHAR(50),
        email_address VARCHAR(255),
        solo_parent_id_no VARCHAR(50),
        relationship_to_child VARCHAR(100),
        
        -- Section B: Child / Beneficiary Information
        child_full_name VARCHAR(255),
        child_dob VARCHAR(50),
        child_age VARCHAR(10),
        child_sex VARCHAR(20),
        school_name VARCHAR(255),
        grade_level VARCHAR(100),
        lrn_number VARCHAR(50),
        type_of_school VARCHAR(100),
        other_enrollment_info VARCHAR(255),

        -- Section C: Family Information
        num_children_in_family VARCHAR(10),
        num_children_studying VARCHAR(10),
        monthly_family_income VARCHAR(100),
        is_4ps_beneficiary VARCHAR(10),
        is_solo_educational_beneficiary VARCHAR(10),
        is_pwd_educational_beneficiary VARCHAR(10),

        service_name VARCHAR(255) DEFAULT 'Solo Parent Educational Assistance Program',
        category VARCHAR(50) DEFAULT 'educational',
        amount NUMERIC(10,2) DEFAULT 5000.00,
        status VARCHAR(100) DEFAULT 'Pending Document Validation',
        disapproval_reason TEXT,
        appointment_date VARCHAR(50),
        appointment_time VARCHAR(50),
        appointment_venue VARCHAR(255),
        payout_date VARCHAR(50),
        payout_time VARCHAR(50),
        payout_venue VARCHAR(255),
        uploaded_documents JSONB,
        details JSONB,
        date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS child_welfare_applications (
        id SERIAL PRIMARY KEY,
        reference_no VARCHAR(50) UNIQUE NOT NULL,
        applicant_name VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        middle_name VARCHAR(100),
        last_name VARCHAR(100),
        suffix VARCHAR(20),
        qcitizen_id VARCHAR(50),
        nationality VARCHAR(50) DEFAULT 'FILIPINO',
        dob VARCHAR(50),
        age VARCHAR(10),
        gender VARCHAR(20),
        civil_status VARCHAR(50),
        house_no VARCHAR(100),
        street_name VARCHAR(150),
        barangay VARCHAR(150),
        phone_number VARCHAR(50),
        email_address VARCHAR(255),
        solo_parent_id_no VARCHAR(50),
        relationship_to_child VARCHAR(100),
        child_full_name VARCHAR(255),
        child_dob VARCHAR(50),
        child_age VARCHAR(10),
        child_sex VARCHAR(20),
        child_address VARCHAR(255),
        school_name VARCHAR(255),
        grade_level VARCHAR(100),
        lrn_number VARCHAR(50),
        type_of_school VARCHAR(100),
        other_enrollment_info VARCHAR(255),
        selected_sectors JSONB,
        selected_services JSONB,
        concern_description TEXT,
        incident_date VARCHAR(50),
        incident_location VARCHAR(255),
        assistance_type VARCHAR(100),
        num_children_in_family VARCHAR(10),
        num_children_studying VARCHAR(10),
        monthly_family_income VARCHAR(100),
        is_4ps_beneficiary VARCHAR(10),
        is_solo_educational_beneficiary VARCHAR(10),
        is_pwd_educational_beneficiary VARCHAR(10),
        service_name VARCHAR(255) DEFAULT 'Child Welfare Services Aid',
        category VARCHAR(50) DEFAULT 'child_welfare',
        amount NUMERIC(10,2) DEFAULT 5000.00,
        status VARCHAR(100) DEFAULT 'Pending Document Validation',
        disapproval_reason TEXT,
        appointment_date VARCHAR(50),
        appointment_time VARCHAR(50),
        appointment_venue VARCHAR(255),
        payout_date VARCHAR(50),
        payout_time VARCHAR(50),
        payout_venue VARCHAR(255),
        uploaded_documents JSONB,
        details JSONB,
        date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Drop redundant separate child_documents table so all docs are consolidated in child_welfare_applications
      DROP TABLE IF EXISTS child_documents CASCADE;

      -- ALTER TABLE migrations for child_welfare_applications to ensure all columns exist
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS suffix VARCHAR(20);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS qcitizen_id VARCHAR(50);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS nationality VARCHAR(50) DEFAULT 'FILIPINO';
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS dob VARCHAR(50);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS age VARCHAR(10);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS house_no VARCHAR(100);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS street_name VARCHAR(150);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS barangay VARCHAR(150);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS email_address VARCHAR(255);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS solo_parent_id_no VARCHAR(50);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS relationship_to_child VARCHAR(100);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS child_full_name VARCHAR(255);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS child_dob VARCHAR(50);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS child_age VARCHAR(10);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS child_sex VARCHAR(20);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS child_address VARCHAR(255);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS school_name VARCHAR(255);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS grade_level VARCHAR(100);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS lrn_number VARCHAR(50);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS type_of_school VARCHAR(100);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS other_enrollment_info VARCHAR(255);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS selected_sectors JSONB;
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS selected_services JSONB;
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS concern_description TEXT;
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS incident_date VARCHAR(50);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS incident_location VARCHAR(255);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS assistance_type VARCHAR(100);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS num_children_in_family VARCHAR(10);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS num_children_studying VARCHAR(10);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS monthly_family_income VARCHAR(100);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS is_4ps_beneficiary VARCHAR(10);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS is_solo_educational_beneficiary VARCHAR(10);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS is_pwd_educational_beneficiary VARCHAR(10);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS service_name VARCHAR(255) DEFAULT 'Child Welfare Services Aid';
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'child_welfare';
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2) DEFAULT 5000.00;
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS status VARCHAR(100) DEFAULT 'Pending Document Validation';
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS disapproval_reason TEXT;
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS appointment_date VARCHAR(50);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS appointment_time VARCHAR(50);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS appointment_venue VARCHAR(255);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS payout_date VARCHAR(50);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS payout_time VARCHAR(50);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS payout_venue VARCHAR(255);
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS uploaded_documents JSONB;
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS details JSONB;
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE child_welfare_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      -- Ensure columns in child_welfare_applications can hold long values and unique index
      ALTER TABLE child_welfare_applications ALTER COLUMN age TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN child_age TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN gender TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN child_sex TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN civil_status TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN is_4ps_beneficiary TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN is_solo_educational_beneficiary TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN is_pwd_educational_beneficiary TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN num_children_in_family TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN num_children_studying TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN monthly_family_income TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN relationship_to_child TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN incident_date TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN incident_location TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN dob TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN child_dob TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN phone_number TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN solo_parent_id_no TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN qcitizen_id TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN assistance_type TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN service_name TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN category TYPE TEXT;
      ALTER TABLE child_welfare_applications ALTER COLUMN status TYPE TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_child_welfare_ref_no ON child_welfare_applications (reference_no);

      -- ALTER TABLE migrations for educational_applications to ensure all columns exist
      ALTER TABLE educational_applications ADD COLUMN IF NOT EXISTS service_name VARCHAR(255) DEFAULT 'Educational Assistance for Indigent Children & Youth';
      ALTER TABLE educational_applications ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'educational';
      ALTER TABLE educational_applications ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2) DEFAULT 5000.00;
      ALTER TABLE educational_applications ADD COLUMN IF NOT EXISTS status VARCHAR(100) DEFAULT 'Pending Document Validation';
      ALTER TABLE educational_applications ADD COLUMN IF NOT EXISTS disapproval_reason TEXT;
      ALTER TABLE educational_applications ADD COLUMN IF NOT EXISTS appointment_date VARCHAR(50);
      ALTER TABLE educational_applications ADD COLUMN IF NOT EXISTS appointment_time VARCHAR(50);
      ALTER TABLE educational_applications ADD COLUMN IF NOT EXISTS appointment_venue VARCHAR(255);
      ALTER TABLE educational_applications ADD COLUMN IF NOT EXISTS payout_date VARCHAR(50);
      ALTER TABLE educational_applications ADD COLUMN IF NOT EXISTS payout_time VARCHAR(50);
      ALTER TABLE educational_applications ADD COLUMN IF NOT EXISTS payout_venue VARCHAR(255);
      ALTER TABLE educational_applications ADD COLUMN IF NOT EXISTS uploaded_documents JSONB;
      ALTER TABLE educational_applications ADD COLUMN IF NOT EXISTS details JSONB;
      ALTER TABLE educational_applications ADD COLUMN IF NOT EXISTS date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE educational_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      -- Ensure columns in educational_applications can hold long values and unique index
      ALTER TABLE educational_applications ALTER COLUMN age TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN child_age TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN gender TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN child_sex TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN civil_status TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN is_4ps_beneficiary TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN is_solo_educational_beneficiary TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN is_pwd_educational_beneficiary TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN num_children_in_family TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN num_children_studying TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN monthly_family_income TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN relationship_to_child TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN dob TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN child_dob TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN phone_number TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN solo_parent_id_no TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN service_name TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN category TYPE TEXT;
      ALTER TABLE educational_applications ALTER COLUMN status TYPE TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_educational_ref_no ON educational_applications (reference_no);

      -- Sync service_name for existing QC-SP-EDU applications in solo_parent_applications
      UPDATE solo_parent_applications 
      SET service_name = 'Solo Parent Educational Assistance Program',
          assistance_type = 'Solo Parent Educational Grant',
          amount = '5000.00'
      WHERE reference_no LIKE 'QC-SP-EDU-%';

      -- Ensure PWD financial subsidy amount is standard 1500.00
      UPDATE pwd_applications 
      SET amount = '1500.00' 
      WHERE amount IS NULL OR amount = '3000.00' OR amount = '5000.00';

      CREATE TABLE IF NOT EXISTS training_applications (
        id SERIAL PRIMARY KEY,
        reference_no VARCHAR(50) UNIQUE NOT NULL,
        course_title VARCHAR(255),
        batch_name VARCHAR(100) DEFAULT '3rd Batch 2026',
        applicant_name VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        middle_name VARCHAR(100),
        last_name VARCHAR(100),
        suffix VARCHAR(20),
        nationality VARCHAR(50) DEFAULT 'FILIPINO',
        dob VARCHAR(50),
        age VARCHAR(10),
        gender VARCHAR(20),
        civil_status VARCHAR(50),
        house_no VARCHAR(100),
        street_name VARCHAR(150),
        barangay VARCHAR(150),
        phone_number VARCHAR(50),
        highest_edu VARCHAR(100),
        school_name VARCHAR(255),
        training_purpose VARCHAR(255),
        purpose_reason TEXT,
        previous_training VARCHAR(255),
        doc_request_letter TEXT,
        doc_qc_id TEXT,
        doc_indigency TEXT,
        status VARCHAR(100) DEFAULT 'Pending Document Validation',
        orientation_date VARCHAR(50),
        orientation_time VARCHAR(50),
        orientation_venue VARCHAR(255),
        rejection_reason TEXT,
        uploaded_documents JSONB,
        details JSONB,
        date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS course_title VARCHAR(255);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS batch_name VARCHAR(100) DEFAULT '3rd Batch 2026';
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS suffix VARCHAR(20);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS nationality VARCHAR(50) DEFAULT 'FILIPINO';
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS dob VARCHAR(50);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS age VARCHAR(10);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS house_no VARCHAR(100);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS street_name VARCHAR(150);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS barangay VARCHAR(150);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS highest_edu VARCHAR(100);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS school_name VARCHAR(255);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS training_purpose VARCHAR(255);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS purpose_reason TEXT;
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS previous_training VARCHAR(255);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS doc_request_letter TEXT;
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS doc_qc_id TEXT;
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS doc_indigency TEXT;
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS status VARCHAR(100) DEFAULT 'Pending Document Validation';
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS orientation_date VARCHAR(50);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS orientation_time VARCHAR(50);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS orientation_venue VARCHAR(255);
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS uploaded_documents JSONB;
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS details JSONB;
      ALTER TABLE training_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        first_name VARCHAR(100),
        middle_name VARCHAR(100),
        last_name VARCHAR(100),
        suffix VARCHAR(20),
        dob VARCHAR(50),
        blood_type VARCHAR(20),
        civil_status VARCHAR(50),
        sex VARCHAR(20),
        occupation VARCHAR(255),
        phone_number VARCHAR(50),
        house_no VARCHAR(100),
        street_name VARCHAR(150),
        barangay VARCHAR(150),
        city VARCHAR(150) DEFAULT 'QUEZON CITY',
        status VARCHAR(50) DEFAULT 'Active',
        is_online BOOLEAN DEFAULT FALSE,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS lockout_stage INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS unlock_otp VARCHAR(10);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS unlock_otp_expires TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_attempt TIMESTAMP;

      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        staff_name VARCHAR(255) DEFAULT 'System Admin',
        action VARCHAR(100) NOT NULL,
        module VARCHAR(100) NOT NULL,
        details TEXT,
        reference_no VARCHAR(100),
        is_deleted BOOLEAN DEFAULT FALSE,
        deleted_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS beneficiary_verifications (
        citizen_key VARCHAR(255) PRIMARY KEY,
        status VARCHAR(50) DEFAULT 'Verified',
        id_type VARCHAR(100),
        notes TEXT,
        verified_by VARCHAR(100) DEFAULT 'System Admin',
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100),
        email VARCHAR(255),
        session_token VARCHAR(255) UNIQUE NOT NULL,
        device_type VARCHAR(50) DEFAULT 'desktop',
        os_name VARCHAR(100),
        browser_name VARCHAR(100),
        ip_address VARCHAR(100),
        location VARCHAR(150),
        signed_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);

    // Seed initial session history for Jefferson if empty
    try {
      const sessionCountCheck = await client.query('SELECT COUNT(*) FROM user_sessions;');
      if (parseInt(sessionCountCheck.rows[0].count, 10) === 0) {
        await client.query(`
          INSERT INTO user_sessions (user_id, email, session_token, device_type, os_name, browser_name, ip_address, location, signed_in_at, last_active_at, is_active)
          VALUES 
          ('USR-2026-002', 'jeffersonlee1234@gmail.com', 'sess_demo_ipad_01', 'tablet', 'Apple iPad Pro (iPadOS 18)', 'Mobile Safari', '119.93.88.102', 'Quezon City, PH', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', TRUE),
          ('USR-2026-002', 'jeffersonlee1234@gmail.com', 'sess_demo_phone_02', 'mobile', 'Samsung Galaxy S23 (Android 14)', 'Chrome Mobile', '112.198.174.45', 'Quezon City, PH', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 hours', TRUE),
          ('USR-2026-002', 'jeffersonlee1234@gmail.com', 'sess_demo_mac_03', 'desktop', 'MacBook Pro (macOS)', 'Safari', '120.29.77.19', 'Pasig City, PH', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', TRUE);
        `);
        console.log('✅ Default demo device sessions seeded for Jefferson Lee!');
      }
    } catch (e) {
      console.warn('Notice seeding user_sessions:', e.message);
    }

    // Seed default admin and user accounts if not present
    const adminCheck = await client.query('SELECT * FROM users WHERE email = $1;', ['admin@gmail.com']);
    if (adminCheck.rows.length === 0) {
      const hashedAdminPass = await bcrypt.hash('Admin!2026', 10);
      await client.query(`
        INSERT INTO users (email, password, role, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5);
      `, ['admin@gmail.com', hashedAdminPass, 'admin', 'System', 'Admin']);
      console.log('✅ Default Admin account seeded: admin@gmail.com / Admin!2026');
    }

    const userCheck = await client.query('SELECT * FROM users WHERE email = $1;', ['jeffersonlee1234@gmail.com']);
    if (userCheck.rows.length === 0) {
      const hashedUserPass = await bcrypt.hash('User!2026', 10);
      await client.query(`
        INSERT INTO users (
          email, password, role, first_name, middle_name, last_name, suffix,
          dob, blood_type, civil_status, sex, occupation, phone_number,
          house_no, street_name, barangay, city
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17
        );
      `, [
        'jeffersonlee1234@gmail.com', hashedUserPass, 'user',
        'JEFFERSON', 'FERNANDO', 'LEE', '',
        '2004-09-27', 'O+', 'Single', 'Male', 'IT SUPPORT', '09155582122',
        '176', '23', 'BAGONG SILANGAN', 'QUEZON CITY'
      ]);
      console.log('✅ Default Resident user seeded: jeffersonlee1234@gmail.com / User!2026');
    }

    // Seed default activity logs if empty
    const logsCheck = await client.query('SELECT COUNT(*) FROM activity_logs;');
    if (parseInt(logsCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO activity_logs (staff_name, action, module, details, reference_no, timestamp) VALUES
        ('System Admin', 'Approved', 'AICS', 'Approved AICS Medical Assistance application for JEFFERSON FERNANDO LEE', 'QC-AICS-2026-MED-8492', NOW() - INTERVAL '2 hours'),
        ('System Admin', 'Approved', 'Solo Parent', 'Validated document requirements and approved cash subsidy for JEFFERSON FERNANDO LEE', 'SP-SUBSIDY-2026-1049', NOW() - INTERVAL '4 hours'),
        ('Social Worker Maria Santos', 'Created', 'Livelihood Program', 'Issued ₱15,000 Livelihood Capital Grant approval for LVH-2026-6536', 'LVH-2026-6536', NOW() - INTERVAL '6 hours'),
        ('System Admin', 'Approved', 'Senior Citizen', 'Verified Senior Citizen Financial Assistance eligibility', 'SNR-2026-9021', NOW() - INTERVAL '1 day'),
        ('System Admin', 'Rejected', 'AICS', 'Rejected incomplete medical certificate submission', 'QC-AICS-2026-MED-1022', NOW() - INTERVAL '1 day 3 hours'),
        ('System Admin', 'Created', 'User Management', 'Seeded resident user account jeffersonlee1234@gmail.com', 'USR-2026-002', NOW() - INTERVAL '2 days');
      `);
      console.log('✅ Default Activity Logs seeded in PostgreSQL DB!');
    }

    console.log('✅ Database tables for AICS, Appointments, PWD, Senior, Livelihood, Solo Parent, Financial Disbursements, Educational Assistance, Training Applications, Users, and Activity Logs verified & ready!');
    client.release();
  } catch (err) {
    console.error('❌ Database Connection Warning/Notice:', err.message);
  }
};



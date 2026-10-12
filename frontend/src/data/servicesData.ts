import type { ServiceItem, ApplicationRecord } from '../types';

export const initialServices: ServiceItem[] = [
  // 1. AICS Services (Pic 1)
  {
    id: 'aics-funeral',
    title: 'Burial / Funeral Assistance',
    category: 'aics',
    description: 'The Funeral and Burial Assistance Program under Ordinance 2865 S-2019 provides financial aid through a Guarantee Letter (GL) to accredited partner funeral homes, covering service packages up to Php25,000.',
    requirements: [
      'Referral Form (optional) – original copy (mula sa Barangay, hospital, o accredited funeral home)',
      'Death Certificate – original Certified True Copy',
      'Notarized Funeral Contract – original copy (mula sa QC-accredited/partner funeral home)',
      'Barangay Certificate of Indigency – original copy (purpose: "Burial/Funeral Assistance")',
      'Valid ID ng informant/nearest kin (preferably QC ID)'
    ],
    processingTime: '24 Hours',
    benefitAmount: 'Up to ₱25,000 Guarantee Letter (GL)',
    iconName: 'funeral',
    badge: 'Urgent Aid'
  },
  {
    id: 'aics-medical',
    title: 'Medical Assistance',
    category: 'aics',
    description: 'The Medical Assistance Program safeguards the health of residents unable to meet medical needs, providing financial or medical support for hospitalization, laboratory examinations, medicines, and supplies.',
    requirements: [
      'Certificate of Indigency from Barangay',
      'Clinical Abstract / Medical Certificate with Doctor Sign & License',
      'Hospital Statement of Account / Billing Statement',
      'Valid Government Issued Photo ID'
    ],
    processingTime: '1 - 2 Business Days',
    benefitAmount: 'Medical Guarantee Letter / Aid',
    iconName: 'medical',
    badge: 'Urgent Aid'
  },

  // 2. PWD Services (Pic 2)
  {
    id: 'pwd-social-assistance',
    title: 'PWD Social Assistance Program',
    category: 'pwd',
    description: 'The PWD Social Assistance Program provides specialized financial aid, healthcare subsidies, assistive devices (wheelchairs, crutches, walkers), and emergency social safety nets for indigent Persons with Disabilities and their families to address disability-related vulnerabilities.',
    requirements: [
      'PWD ID Number',
      'Doctor recommendation for disability / Medical Certificate',
      'Certificate of Indigency from Barangay',
      'Valid Government Photo ID'
    ],
    processingTime: '3 - 5 Business Days',
    benefitAmount: '₱1,500.00 Quarterly Pension & Financial Aid',
    iconName: 'pwd',
    badge: 'PWD Welfare'
  },

  // 3. Senior Citizen Services
  {
    id: 'senior-social-pension',
    title: 'Senior Citizen Social Pension Program',
    category: 'senior',
    description: 'The Senior Citizen Social Pension Program provides specialized financial aid (₱1,000/month stipend), healthcare subsidies, and emergency social safety nets for indigent Senior Citizens 60 years old and above who have no regular income or pension.',
    requirements: [
      'Senior Citizen ID Card / OSCA Clearance',
      'Barangay Certificate of Non-Employment / Indigency',
      'Proof of Age (PhilSys / Birth Certificate)'
    ],
    processingTime: 'Quarterly Disbursement',
    benefitAmount: '₱3,000 Quarterly Cash Pension',
    iconName: 'senior',
    badge: 'Senior Welfare'
  },

  // 4. Solo Parent Services (Pic 3)
  {
    id: 'soloparent-financial',
    title: 'Solo Parent Financial Subsidy Program',
    category: 'soloparent',
    description: 'SOLO PARENT SECTOR: Qualified applicants may receive financial subsidy. For qualified Solo Parents who meet the applicable income and program requirements. Eligibility is subject to document verification and assessment before approval.',
    requirements: [
      'Affidavit of Solo Parent Status (Death Cert, Legal Separation, or Abandonment)',
      'Birth Certificate of Minor Children',
      'Barangay Residency Certificate (at least 6 months residency)'
    ],
    processingTime: '3 - 5 Business Days',
    benefitAmount: '₱1,000 Monthly Financial Subsidy',
    iconName: 'soloparent',
    badge: 'Welfare Subsidy'
  },
  {
    id: 'soloparent-edu',
    title: 'Solo Parent Educational Assistance Program',
    category: 'soloparent',
    description: "Educational financial assistance for indigent solo parents' dependent children/beneficiaries who are currently studying. The program includes solo parents with two (2) or more children enrolled in public school, providing financial assistance of P5,000 per qualified beneficiary, subject to interview and social worker assessment prior to granting assistance.",
    requirements: [
      'Valid Solo Parent ID',
      'School Enrollment / Registration Card of Child',
      'Barangay Certificate of Indigency'
    ],
    processingTime: '3 - 5 Business Days',
    benefitAmount: '₱5,000 per Student Beneficiary',
    iconName: 'education',
    badge: 'Scholarship'
  },

  // 5. Child Welfare Services
  {
    id: 'childwelfare-edu',
    title: 'Educational Assistance for Indigent Children & Youth',
    category: 'child',
    description: "Provides educational and financial aid support for indigent children & youth, solo parents' children/beneficiaries, and children with disabilities (CWD) residing in Quezon City.",
    requirements: [
      'Child Birth Certificate',
      'Guardian / Caregiver Barangay Indigency',
      'School Certificate / Report Card'
    ],
    processingTime: '3 - 5 Business Days',
    benefitAmount: 'Educational Financial Grant',
    iconName: 'child',
    badge: 'Education Aid'
  },
  {
    id: 'childwelfare-services',
    title: 'Child Welfare Services',
    category: 'child',
    description: 'Comprehensive care, protection, and developmental welfare services dedicated to ensuring the well-being and rights of children and youth in Quezon City.',
    requirements: [
      'Child Birth Certificate',
      'Parent / Guardian Valid ID',
      'Barangay Residency Certificate'
    ],
    processingTime: 'Immediate Assistance',
    benefitAmount: 'Protection & Support Package',
    iconName: 'child',
    badge: 'Child Care'
  },

  // 6. Livelihood & Training (Pic 4)
  {
    id: 'livelihood-grant',
    title: 'Livelihood Micro-Enterprise Seed Capital',
    category: 'livelihood',
    description: 'Capital grant up to P15,000 for starting small sari-sari store, carwash, tailoring, or food vending business for qualified beneficiaries.',
    requirements: [
      'Simple Business Proposal / Plan',
      'Barangay Business Clearance & Indigency',
      'Attendance in CSWD Livelihood Orientation Workshop'
    ],
    processingTime: '7 - 10 Business Days',
    benefitAmount: '₱15,000 Micro-Capital Grant',
    iconName: 'livelihood',
    badge: 'Capital Grant'
  },

  // Training Courses (Pic 4 - 10 Open Programs)
  {
    id: 'training-bread-pastry',
    title: 'Bread and Pastry Making',
    category: 'livelihood',
    description: 'Learn commercial bread and pastry production, baking techniques, measuring and mixing, pastry decorating, oven management, and food safety standards.',
    requirements: [
      'High School Diploma / ALS Certificate',
      'Barangay Clearance & Indigency',
      '2x2 ID Photos (2 copies)'
    ],
    processingTime: '18 Working Days Training',
    benefitAmount: 'Free Vocational Course + NC II',
    iconName: 'education',
    badge: '25 Slots Available'
  },
  {
    id: 'training-barista',
    title: 'Barista Course',
    category: 'livelihood',
    description: 'Master espresso extraction, milk steaming, latte art, coffee brewing methods, equipment maintenance, and coffee shop customer service.',
    requirements: [
      'High School Diploma / ALS Certificate',
      'Barangay Clearance & Indigency',
      '2x2 ID Photos (2 copies)'
    ],
    processingTime: '18 Working Days Training',
    benefitAmount: 'Free Vocational Course + NC II',
    iconName: 'education',
    badge: '25 Slots Available'
  },
  {
    id: 'training-computer-literacy',
    title: 'Basic Computer Literacy & Call Center Service',
    category: 'livelihood',
    description: 'Practical training in computer operations, Microsoft Office tools, typing speed, English communication skills, call handling techniques, and BPO job preparation.',
    requirements: [
      'High School Diploma / ALS Certificate',
      'Barangay Clearance & Indigency',
      '2x2 ID Photos (2 copies)'
    ],
    processingTime: '18 Working Days Training',
    benefitAmount: 'Free Vocational Course',
    iconName: 'education',
    badge: '25 Slots Available'
  },
  {
    id: 'training-hairdressing',
    title: 'Hairdressing & Cosmetology',
    category: 'livelihood',
    description: 'Hands-on training in hair cutting, hair styling, hair coloring, blowdrying, hair rebonding/perming, and salon sanitation management.',
    requirements: [
      'High School Diploma / ALS Certificate',
      'Barangay Clearance & Indigency',
      '2x2 ID Photos (2 copies)'
    ],
    processingTime: '30 Working Days Training',
    benefitAmount: 'Free Vocational Course + NC II',
    iconName: 'education',
    badge: '25 Slots Available'
  },
  {
    id: 'training-tailoring',
    title: 'Tailoring & Dressmaking NC II',
    category: 'livelihood',
    description: 'Garment construction, pattern drafting, sewing machine operation, measurement, and commercial dressmaking skills.',
    requirements: [
      'High School Diploma / ALS Certificate',
      'Barangay Clearance & Indigency',
      '2x2 ID Photos (2 copies)'
    ],
    processingTime: '25 Working Days Training',
    benefitAmount: 'Free Vocational Course + NC II',
    iconName: 'education',
    badge: '25 Slots Available'
  },
  {
    id: 'training-food-processing',
    title: 'Food Processing & Commercial Cooking',
    category: 'livelihood',
    description: 'Food preservation, meat curing, commercial food prep, food safety, packaging, and catering business skills.',
    requirements: [
      'High School Diploma / ALS Certificate',
      'Barangay Clearance & Indigency',
      '2x2 ID Photos (2 copies)'
    ],
    processingTime: '20 Working Days Training',
    benefitAmount: 'Free Vocational Course + NC II',
    iconName: 'education',
    badge: '25 Slots Available'
  },
  {
    id: 'training-automotive',
    title: 'Automotive Servicing NC II',
    category: 'livelihood',
    description: 'Engine overhaul, auto mechanics, electrical system diagnostics, brake servicing, and vehicle maintenance.',
    requirements: [
      'High School Diploma / ALS Certificate',
      'Barangay Clearance & Indigency',
      '2x2 ID Photos (2 copies)'
    ],
    processingTime: '30 Working Days Training',
    benefitAmount: 'Free Vocational Course + NC II',
    iconName: 'education',
    badge: '20 Slots Available'
  },
  {
    id: 'training-electrical',
    title: 'Electrical Installation & Maintenance NC II',
    category: 'livelihood',
    description: 'Building wiring installation, circuit breaker assembly, electrical safety, conduit bending, and industrial maintenance.',
    requirements: [
      'High School Diploma / ALS Certificate',
      'Barangay Clearance & Indigency',
      '2x2 ID Photos (2 copies)'
    ],
    processingTime: '25 Working Days Training',
    benefitAmount: 'Free Vocational Course + NC II',
    iconName: 'education',
    badge: '20 Slots Available'
  },
  {
    id: 'training-massage',
    title: 'Massage Therapy & Wellness NC II',
    category: 'livelihood',
    description: 'Human anatomy, Swedish/Hilot massage techniques, spa therapy ethics, customer hygiene, and licensure prep.',
    requirements: [
      'High School Diploma / ALS Certificate',
      'Barangay Clearance & Indigency',
      '2x2 ID Photos (2 copies)'
    ],
    processingTime: '20 Working Days Training',
    benefitAmount: 'Free Vocational Course + NC II',
    iconName: 'education',
    badge: '25 Slots Available'
  },
  {
    id: 'training-welding',
    title: 'Shielded Metal Arc Welding (SMAW) NC II',
    category: 'livelihood',
    description: 'Industrial metal fabrication, welding safety, joint preparation, position welding, and SMAW certification.',
    requirements: [
      'High School Diploma / ALS Certificate',
      'Barangay Clearance & Indigency',
      '2x2 ID Photos (2 copies)'
    ],
    processingTime: '30 Working Days Training',
    benefitAmount: 'Free Vocational Course + NC II',
    iconName: 'education',
    badge: '15 Slots Available'
  }
];

export const initialApplications: ApplicationRecord[] = [];

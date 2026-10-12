import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'English' | 'Tagalog';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const DICTIONARY: Record<Language, Record<string, string>> = {
  English: {
    // Navigation / Sidebar
    'nav.guide': 'Help & Service Guide',
    'nav.aics': 'AICS Assistance',
    'nav.pwd': 'PWD Services',
    'nav.senior': 'Senior Citizen Services',
    'nav.solo_parent': 'Solo Parent Services',
    'nav.child_welfare': 'Child Welfare Services',
    'nav.livelihood': 'Livelihood & Training',
    'nav.disbursement': 'Financial Aid Disbursements',
    'nav.history': 'Application History',
    'nav.profile': 'User Profile',
    'nav.logout': 'Log Out',
    'nav.admin_dashboard': 'Admin Dashboard',
    'nav.admin_approvals': 'Application Approvals',
    'nav.admin_disbursement': 'Payout Scheduling',
    'nav.admin_appointments': 'Appointment Management',
    'nav.admin_users': 'User Management',
    'nav.admin_reports': 'Reports & Audit Trail',

    // Header & Badges
    'header.title': 'GovServe Citizen Portal',
    'header.subtitle': 'Quezon City Social Services & Development Department',
    'header.citizen_resident': 'Citizen Resident',
    'header.system_admin': 'System Admin',

    // Common Buttons & Actions
    'btn.submit': 'Submit Application',
    'btn.cancel': 'Cancel',
    'btn.next': 'Next Step',
    'btn.previous': 'Previous Step',
    'btn.edit': 'Edit Profile',
    'btn.close': 'Close',
    'btn.save': 'Save Changes',
    'btn.download_gl': 'Download Guarantee Letter (GL)',
    'btn.resend': 'Resend Code',
    'btn.verify': 'Verify Code',
    'btn.apply_now': 'Apply Now',

    // Form Section Titles
    'form.step1': 'Step 1: Personal Information',
    'form.step2': 'Step 2: Assistance Details',
    'form.step3': 'Step 3: Document Requirements Upload',
    'form.step4': 'Step 4: Review & Final Submission',

    // Common Form Fields
    'field.first_name': 'First Name',
    'field.middle_name': 'Middle Name',
    'field.last_name': 'Last Name',
    'field.suffix': 'Suffix (e.g. Jr, III)',
    'field.dob': 'Date of Birth',
    'field.age': 'Age',
    'field.gender': 'Gender',
    'field.civil_status': 'Civil Status',
    'field.nationality': 'Nationality',
    'field.house_no': 'House / Unit No.',
    'field.street': 'Street Name',
    'field.barangay': 'Barangay',
    'field.city': 'City / Municipality',
    'field.phone': 'Mobile Phone Number',
    'field.email': 'Email Address',
    'field.occupation': 'Occupation',
    'field.hospital': 'Hospital / Facility Name',
    'field.diagnosis': 'Medical Condition / Diagnosis',
    'field.deceased_name': 'Full Name of Deceased',
    'field.date_of_death': 'Date of Death',

    // Status Badges
    'status.under_review': 'Under Review',
    'status.approved': 'Approved',
    'status.payout_scheduled': 'Payout Scheduled',
    'status.released': 'RELEASED / COMPLETED',
    'status.rejected': 'Rejected',

    // Profile Language Tab
    'profile.tab_account': 'Account Information',
    'profile.tab_personal': 'Personal Information',
    'profile.tab_devices': 'Devices & History',
    'profile.tab_language': 'Language',
    'profile.lang_title': 'Language Selection',
    'profile.lang_subtitle': 'Choose the language used across all portal modules.',
    'profile.danger_zone': 'Danger Zone',
    'profile.deactivate': 'Deactivate Account',
    'profile.delete': 'Delete Account',
  },
  Tagalog: {
    // Navigation / Sidebar
    'nav.guide': 'Gabay sa Serbisyo at Tulong',
    'nav.aics': 'Tulong sa Kapus-Palad (AICS)',
    'nav.pwd': 'Serbisyo para sa PWD',
    'nav.senior': 'Serbisyo sa Nakatatanda (Senior)',
    'nav.solo_parent': 'Serbisyo sa Solo Parent',
    'nav.child_welfare': 'Kalinga at Keseho ng Bata',
    'nav.livelihood': 'Pangkabuhayan at Pagsasanay',
    'nav.disbursement': 'Pamamahagi ng Tulong Pinansyal',
    'nav.history': 'Kasaysayan ng Aplikasyon',
    'nav.profile': 'Profile ng Mamamayan',
    'nav.logout': 'Mag-Log Out',
    'nav.admin_dashboard': 'Dashboard ng Admin',
    'nav.admin_approvals': 'Pag-apruba ng Aplikasyon',
    'nav.admin_disbursement': 'Pagtatakda ng Payout',
    'nav.admin_appointments': 'Pamamahala ng Appointment',
    'nav.admin_users': 'Pamamahala ng User Akaunt',
    'nav.admin_reports': 'Ulat at Audit Logs',

    // Header & Badges
    'header.title': 'GovServe Portal ng Mamamayan',
    'header.subtitle': 'Kagawaran ng Serbisyong Panlipunan at Pag-unlad ng Quezon City',
    'header.citizen_resident': 'Rehistradong Mamamayan',
    'header.system_admin': 'Tagapamahala ng Sistema',

    // Common Buttons & Actions
    'btn.submit': 'I-submit ang Aplikasyon',
    'btn.cancel': 'Kanselahin',
    'btn.next': 'Kasunod na Hakbang',
    'btn.previous': 'Nakaraang Hakbang',
    'btn.edit': 'Baguhin ang Profile',
    'btn.close': 'Isara',
    'btn.save': 'I-save ang Pagbabago',
    'btn.download_gl': 'I-download ang Guarantee Letter (GL)',
    'btn.resend': 'Muling Ipadala ang Code',
    'btn.verify': 'I-verify ang Code',
    'btn.apply_now': 'Mag-apply Ngayon',

    // Form Section Titles
    'form.step1': 'Hakbang 1: Personal na Impormasyon',
    'form.step2': 'Hakbang 2: Detalye ng Hinihinging Tulong',
    'form.step3': 'Hakbang 3: Pag-upload ng mga Kailangang Dokumento',
    'form.step4': 'Hakbang 4: Pagsusuri at Huling Pag-submit',

    // Common Form Fields
    'field.first_name': 'Unang Pangalan',
    'field.middle_name': 'Gitnang Pangalan',
    'field.last_name': 'Apelyido',
    'field.suffix': 'Suffix (hal. Jr, III)',
    'field.dob': 'Petsa ng Kapanganakan',
    'field.age': 'Edad',
    'field.gender': 'Kasarian',
    'field.civil_status': 'Sitwasyong Sibil',
    'field.nationality': 'Nasyonalidad',
    'field.house_no': 'Numero ng Bahay / Pintuan',
    'field.street': 'Pangalan ng Kalsada',
    'field.barangay': 'Barangay',
    'field.city': 'Lungsod / Munisipalidad',
    'field.phone': 'Numero ng Telepono / Mobile',
    'field.email': 'Email Address',
    'field.occupation': 'Trabaho / Hanapbuhay',
    'field.hospital': 'Pangalan ng Ospital o Pasilidad',
    'field.diagnosis': 'Karamdaman / Diagnostiko sa Kalusugan',
    'field.deceased_name': 'Buong Pangalan ng Yumao',
    'field.date_of_death': 'Petsa ng Pagpanaw',

    // Status Badges
    'status.under_review': 'Sinusuri Pa',
    'status.approved': 'Inaprubahan Na',
    'status.payout_scheduled': 'Nakatakda na ang Payout',
    'status.released': 'NAIPAMAHAGI / KUMPLETO NA',
    'status.rejected': 'Tinanggihan',

    // Profile Language Tab
    'profile.tab_account': 'Impormasyon ng Akaunt',
    'profile.tab_personal': 'Personal na Impormasyon',
    'profile.tab_devices': 'Kagamitan at Kasaysayan',
    'profile.tab_language': 'Wika / Language',
    'profile.lang_title': 'Pagpili ng Wika',
    'profile.lang_subtitle': 'Pumili ng wikang gagamitin sa buong portal at mga module.',
    'profile.danger_zone': 'Sensitibong Bahagi (Danger Zone)',
    'profile.deactivate': 'I-deactivate ang Akaunt',
    'profile.delete': 'Burahin ang Akaunt',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('portal_language');
    return (saved === 'Tagalog' ? 'Tagalog' : 'English') as Language;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('portal_language', lang);
  };

  const t = (key: string): string => {
    return DICTIONARY[language]?.[key] || DICTIONARY['English']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'English',
      setLanguage: () => {},
      t: (key: string) => key,
    };
  }
  return context;
};

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Globe,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  Smartphone,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Copy,
  Check,
  Printer,
  FileText,
  Lock,
  Database,
  HeartHandshake,
  Users,
  Baby,
  GraduationCap,
  Briefcase,
  Calendar,
  Bell,
  AlertCircle,
  Sparkles,
  LayoutGrid,
  ChevronRight,
  Menu,
  X,
  HardDrive,
  Wifi,
  UserCheck,
  BookOpen,
  Scale,
  Info,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE_URL } from '../../config/api';

interface LandingViewProps {
  onAccessPortal: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

type PublicPage = 'home' | 'mobile-app' | 'announcements' | 'how-it-works' | 'legal';

interface BilingualText {
  en: string;
  ph: string;
}

interface LegalSection {
  title: BilingualText;
  paragraphs: BilingualText[];
  items?: {
    term: string;
    text: BilingualText;
  }[];
}

interface LegalDoc {
  id: string;
  title: BilingualText;
  shortTitle: BilingualText;
  category: BilingualText;
  summary: BilingualText;
  keyPoints: BilingualText[];
  sections: LegalSection[];
}

const LEGAL_DOCS: LegalDoc[] = [
  {
    id: 'terms',
    title: { en: 'Terms of Use', ph: 'Terms of Use' },
    shortTitle: { en: 'Terms of Use', ph: 'Terms of Use' },
    category: { en: 'User Agreement', ph: 'Kasunduan ng Gumagamit' },
    summary: {
      en: 'The rules every citizen beneficiary and MSWDO staff member agrees to when using GovServe Social Services Management.',
      ph: 'Ang mga patakarang sinasang-ayunan ng bawat mamamayan at kawani ng MSWDO sa paggamit ng GovServe Social Services Management.'
    },
    keyPoints: [
      {
        en: 'Submit only truthful personal details and authentic supporting documents',
        ph: 'Magpasa lamang ng totoong personal na detalye at tunay na mga dokumento'
      },
      {
        en: 'Never share your password or one-time verification code with anyone',
        ph: 'Huwag ibigay kaninuman ang iyong password o one-time verification code'
      },
      {
        en: 'Keep only one registered citizen account per Quezon City resident',
        ph: 'Panatilihin ang isang rehistradong citizen account lamang bawat residente'
      },
      {
        en: 'All applications undergo official MSWDO social worker verification',
        ph: 'Lahat ng aplikasyon ay dumadaan sa opisyal na beripikasyon ng MSWDO social worker'
      }
    ],
    sections: [
      {
        title: { en: 'Who can use GovServe SSM', ph: 'Sino ang maaaring gumamit ng GovServe SSM' },
        paragraphs: [
          {
            en: 'GovServe Social Services Management (SSM) is the official social welfare and financial assistance portal for Quezon City residents. Citizens sign in to apply for AICS, PWD, Senior Citizen, Solo Parent, Child Welfare, Educational, and Livelihood programs.',
            ph: 'Ang GovServe Social Services Management (SSM) ay ang opisyal na portal ng serbisyong panlipunan at tulong pinansyal para sa mga residente ng Quezon City. Nagsa-sign in ang mga mamamayan upang mag-apply sa AICS, PWD, Senior Citizen, Solo Parent, Child Welfare, Educational, at Livelihood programs.'
          },
          {
            en: 'Accounts for MSWDO social workers, evaluators, and system administrators are provisioned and managed by authorized department administrators.',
            ph: 'Ang mga account para sa MSWDO social workers, evaluators, at system administrators ay ginagawa at pinamamahalaan ng mga awtorisadong administrator ng departamento.'
          }
        ]
      },
      {
        title: { en: 'Your citizen account & QCitizen profile', ph: 'Ang iyong citizen account at QCitizen profile' },
        paragraphs: [
          {
            en: 'Provide your real full name, date of birth, barangay, complete residential address, and valid QCitizen ID or sectoral ID number. Your profile details determine your eligibility for sectoral subsidies and crisis assistance.',
            ph: 'Ibigay ang iyong tunay na buong pangalan, petsa ng kapanganakan, barangay, kumpletong tirahan, at balidong QCitizen ID o sectoral ID number. Ang detalye ng iyong profile ang batayan ng iyong kwalipikasyon sa mga benepisyo at tulong.'
          },
          {
            en: 'Keep your account secure and never share your password or 6-digit verification code with anyone.',
            ph: 'Ingatan ang iyong account at huwag ibigay kaninuman ang iyong password o 6-digit verification code.'
          }
        ]
      },
      {
        title: { en: 'Truthful applications and authentic documents', ph: 'Totoong aplikasyon at tunay na mga dokumento' },
        paragraphs: [
          {
            en: 'Upload clear, unaltered copies of required documents such as Medical Abstracts, Hospital Bills, Death Certificates, Funeral Contracts, Solo Parent IDs, PWD/Senior Citizen IDs, and Certificates of Enrollment (COE).',
            ph: 'Mag-upload ng malinaw at tunay na kopya ng mga kailangang dokumento gaya ng Medical Abstract, Hospital Bill, Death Certificate, Funeral Contract, Solo Parent ID, PWD/Senior Citizen ID, at Certificate of Enrollment (COE).'
          },
          {
            en: 'Submitting falsified, tampered, or duplicate documents results in immediate disapproval of the application and may lead to account suspension.',
            ph: 'Ang pagpapasa ng peke, binago, o dobleng dokumento ay magreresulta sa agarang pagbasura ng aplikasyon at maaaring humantong sa pagsuspinde ng account.'
          }
        ]
      },
      {
        title: { en: 'Appointments, orientations, and payouts', ph: 'Mga appointment, oryentasyon, at payout' },
        paragraphs: [
          {
            en: 'Approved applicants for Livelihood & Skills Training must attend the scheduled orientation. Financial aid and Guarantee Letters (GL) must be claimed on the scheduled payout date with valid identification.',
            ph: 'Ang mga aprubadong aplikante sa Livelihood & Skills Training ay kailangang dumalo sa itinakdang oryentasyon. Ang tulong pinansyal at Guarantee Letter (GL) ay dapat kunin sa itinakdang petsa ng payout dala ang balidong ID.'
          }
        ]
      },
      {
        title: { en: 'Acceptable use and security limits', ph: 'Wastong paggamit at limitasyon sa seguridad' },
        paragraphs: [
          {
            en: 'Do not attempt to access another resident’s account, submit automated requests, or upload unrelated files. Repeated failed login attempts trigger progressive temporary account lockouts to protect citizen data.',
            ph: 'Huwag subukang buksan ang account ng ibang residente, magpadala ng automated requests, o mag-upload ng walang kaugnayang file. Ang paulit-ulit na maling pag-login ay magti-trigger ng pansamantalang pag-lock ng account upang protektahan ang datos.'
          }
        ]
      }
    ]
  },
  {
    id: 'privacy',
    title: { en: 'Privacy Notice', ph: 'Privacy Notice' },
    shortTitle: { en: 'Privacy Notice', ph: 'Privacy Notice' },
    category: { en: 'Data Privacy · RA 10173', ph: 'Data Privacy · RA 10173' },
    summary: {
      en: 'What personal and socio-economic information GovServe SSM collects, why it is needed, who can access it, and your rights under the Data Privacy Act of 2012.',
      ph: 'Anong personal at socio-economic na impormasyon ang kinukuha ng GovServe SSM, bakit ito kailangan, sino ang nakakakita nito, at ang iyong mga karapatan ayon sa Data Privacy Act of 2012.'
    },
    keyPoints: [
      {
        en: 'Collected strictly for social welfare evaluation and aid disbursement',
        ph: 'Kinukuha lamang para sa pagsusuri ng serbisyong panlipunan at pamamahagi ng tulong'
      },
      {
        en: 'Never sold and never shared with advertisers or unauthorized third parties',
        ph: 'Hindi ibinebenta at hindi ibinabahagi sa advertisers o hindi awtorisadong partido'
      },
      {
        en: 'Role-based access ensures only authorized MSWDO caseworkers view case files',
        ph: 'Tanging awtorisadong MSWDO caseworkers lamang ang nakakakita sa mga rekord'
      },
      {
        en: 'You may inspect, update, or request correction of your personal profile',
        ph: 'Maaari mong tingnan, i-update, o ipa-tama ang iyong personal na impormasyon'
      }
    ],
    sections: [
      {
        title: { en: 'What we collect', ph: 'Ano ang kinukuha' },
        paragraphs: [
          {
            en: 'Your profile details (full name, date of birth, sex, civil status, occupation, contact number, email, house number, street, and barangay); your QCitizen ID or sectoral ID numbers; and supporting documents uploaded for AICS, PWD, Senior Citizen, Solo Parent, Child Welfare, Educational, and Livelihood applications.',
            ph: 'Ang detalye ng iyong profile (buong pangalan, petsa ng kapanganakan, kasarian, civil status, trabaho, contact number, email, house number, kalye, at barangay); ang iyong QCitizen ID o sectoral ID numbers; at ang mga dokumentong in-upload para sa AICS, PWD, Senior Citizen, Solo Parent, Child Welfare, Educational, at Livelihood applications.'
          },
          {
            en: 'For security and device recognition, sign-in timestamps, browser/device type, and audit trail actions are also recorded.',
            ph: 'Para sa seguridad at pagkilala ng device, naitatala rin ang oras ng pag-sign in, uri ng browser/device, at audit trail ng mga aksyon.'
          }
        ]
      },
      {
        title: { en: 'Why we use it', ph: 'Bakit ito ginagamit' },
        paragraphs: [
          {
            en: 'To verify your residency and sectoral eligibility, evaluate crisis and welfare applications, issue Hospital or Funeral Guarantee Letters (GL), schedule orientations and appointments, release financial aid payrolls, and prevent duplicate claims.',
            ph: 'Upang kumpirmahin ang iyong pagiging residente at kwalipikasyon, suriin ang mga aplikasyon sa tulong, maglabas ng Hospital o Funeral Guarantee Letter (GL), magtakda ng oryentasyon at appointment, maglabas ng financial aid, at maiwasan ang dobleng claim.'
          }
        ]
      },
      {
        title: { en: 'Who can see it', ph: 'Sino ang nakakakita' },
        paragraphs: [
          {
            en: 'Authorized MSWDO social workers, program evaluators, disbursement officers, and system administrators assigned to process your application. Child Welfare intake records are strictly confidential and restricted to designated social welfare officers.',
            ph: 'Mga awtorisadong MSWDO social workers, program evaluators, disbursement officers, at system administrators na nakatalaga sa pagproseso ng iyong aplikasyon. Ang mga rekord sa Child Welfare ay mahigpit na kumpidensyal at limitado lamang sa nakatalagang social worker.'
          }
        ]
      },
      {
        title: { en: 'How it is protected', ph: 'Paano ito pinoprotektahan' },
        paragraphs: [
          {
            en: 'All traffic between your browser or mobile app and the server is encrypted via HTTPS. Account sign-ins are protected with progressive lockout safeguards, familiar device tracking, and email OTP verification. All administrative actions are logged in the immutable audit trail.',
            ph: 'Ang lahat ng koneksyon sa pagitan ng iyong browser o mobile app at server ay naka-encrypt gamit ang HTTPS. Ang pag-sign in ay protektado ng progressive lockout, familiar device tracking, at email OTP verification. Lahat ng aksyon ng admin ay nakatala sa audit trail.'
          }
        ]
      },
      {
        title: { en: 'Your rights under RA 10173', ph: 'Ang iyong mga karapatan sa ilalim ng RA 10173' },
        paragraphs: [
          {
            en: 'Under the Data Privacy Act of 2012 (Republic Act 10173), you have the right to be informed, to access and update your personal profile, to object to unauthorized processing, and to lodge a concern with the Quezon City Data Protection Officer or the National Privacy Commission.',
            ph: 'Sa ilalim ng Data Privacy Act of 2012 (Republic Act 10173), may karapatan kang mabigyan ng impormasyon, ma-access at ma-update ang iyong profile, tumutol sa hindi awtorisadong pagproseso, at maghain ng reklamo sa Quezon City Data Protection Officer o sa National Privacy Commission.'
          }
        ]
      }
    ]
  },
  {
    id: 'browser-storage',
    title: { en: 'Browser Storage Notice', ph: 'Browser Storage Notice' },
    shortTitle: { en: 'Browser Storage', ph: 'Browser Storage' },
    category: { en: 'Cookies & Storage', ph: 'Cookies at Storage' },
    summary: {
      en: 'Every item GovServe SSM stores in your browser, why it is there, and how you can clear it.',
      ph: 'Ang bawat item na iniimbak ng GovServe SSM sa iyong browser, bakit ito naroon, at paano mo ito mabubura.'
    },
    keyPoints: [
      {
        en: 'No advertising cookies and no third-party marketing trackers',
        ph: 'Walang advertising cookies at walang third-party marketing trackers'
      },
      {
        en: 'Stores only your active session, language preference, and theme setting',
        ph: 'Iniimbak lamang ang iyong aktibong session, wika, at theme setting'
      },
      {
        en: 'Session items automatically clear when you close the browser tab',
        ph: 'Kusang nabubura ang session items kapag isinara mo ang browser tab'
      },
      {
        en: 'Signing out immediately removes your active user profile from storage',
        ph: 'Agad na inaalis ng pag-sign out ang iyong aktibong profile sa storage'
      }
    ],
    sections: [
      {
        title: { en: 'No tracking cookies', ph: 'Walang tracking cookies' },
        paragraphs: [
          {
            en: 'GovServe SSM does not use third-party advertising cookies or cross-site marketing trackers. Instead, it uses standard browser localStorage and sessionStorage strictly for essential portal functionality.',
            ph: 'Hindi gumagamit ang GovServe SSM ng third-party advertising cookies o cross-site marketing trackers. Sa halip, gumagamit lamang ito ng localStorage at sessionStorage para sa mahahalagang function ng portal.'
          }
        ]
      },
      {
        title: { en: 'Items kept in localStorage', ph: 'Mga item na nasa localStorage' },
        paragraphs: [
          {
            en: 'These items remain in your browser so your settings and session persist across page reloads until you sign out or clear your browser data:',
            ph: 'Mananatili ang mga item na ito sa iyong browser upang hindi mawala ang iyong settings kapag nag-reload hanggang sa mag-sign out ka:'
          }
        ],
        items: [
          {
            term: 'currentUser',
            text: {
              en: 'Your signed-in citizen or admin profile details so the portal displays your applications and profile. Removed when you log out.',
              ph: 'Ang detalye ng iyong naka-sign in na citizen o admin profile. Inaalis kapag nag-log out ka.'
            }
          },
          {
            term: 'govserve_theme_mode',
            text: {
              en: 'Remembers whether you selected Light Mode or Dark Mode inside the dashboard.',
              ph: 'Tanda kung Light Mode o Dark Mode ang pinili mo sa loob ng dashboard.'
            }
          },
          {
            term: 'govserve_language',
            text: {
              en: 'Remembers whether pages display in English or Filipino.',
              ph: 'Tanda kung English o Filipino ang ipinapakita sa mga pahina.'
            }
          },
          {
            term: 'govserve_known_devices_v1',
            text: {
              en: 'Recognizes your familiar browser/device on this computer or phone so new-device security alerts only appear for unfamiliar logins.',
              ph: 'Kinikilala ang iyong pamilyar na browser/device upang lumabas lamang ang security alert kapag bago ang device.'
            }
          },
          {
            term: 'govserve_last_activity',
            text: {
              en: 'Tracks portal activity to automatically expire idle sessions after 5 minutes of inactivity.',
              ph: 'Sinusubaybayan ang aktibidad upang kusang mag-expire ang session matapos ang 5 minutong walang galaw.'
            }
          }
        ]
      },
      {
        title: { en: 'Items kept in sessionStorage', ph: 'Mga item na nasa sessionStorage' },
        paragraphs: [
          {
            en: 'These items are kept only while your current browser tab is open and disappear when the tab is closed:',
            ph: 'Iniingatan lamang ang mga ito habang bukas ang iyong browser tab at kusang nawawala kapag isinara ang tab:'
          }
        ],
        items: [
          {
            term: 'activeTab / adminTab',
            text: {
              en: 'Remembers which module tab you are viewing so refreshing the page keeps you in the same view.',
              ph: 'Tanda kung aling module tab ang tinitingnan mo upang manatili ka sa parehong view kapag nag-refresh.'
            }
          },
          {
            term: 'userRole',
            text: {
              en: 'Indicates whether the current tab session is viewing the Citizen Portal or Admin Portal.',
              ph: 'Nagtatakda kung Citizen Portal o Admin Portal ang bukas sa kasalukuyang tab.'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'verification-policy',
    title: { en: 'Application & Document Verification Policy', ph: 'Application & Document Verification Policy' },
    shortTitle: { en: 'Document Verification', ph: 'Document Verification' },
    category: { en: 'Acceptable Use', ph: 'Wastong Paggamit' },
    summary: {
      en: 'Rules for submitting welfare applications, required supporting documents per module, and duplicate claim cooldown policies.',
      ph: 'Mga patakaran sa pagpapasa ng aplikasyon, mga kailangang dokumento sa bawat programa, at patakaran laban sa dobleng claim.'
    },
    keyPoints: [
      {
        en: 'QCitizen ID or valid government/sectoral ID is required for verification',
        ph: 'Kailangan ang QCitizen ID o balidong government/sectoral ID sa beripikasyon'
      },
      {
        en: 'Duplicate medical assistance claims are locked during the 6-month cooldown period',
        ph: 'Naka-lock ang dobleng medical assistance claim sa loob ng 6-month cooldown period'
      },
      {
        en: 'Educational Aid requires a valid Certificate of Enrollment (COE)',
        ph: 'Kailangan ng balidong Certificate of Enrollment (COE) para sa Educational Aid'
      },
      {
        en: 'Each application receives a unique tracking reference number',
        ph: 'Bawat aplikasyon ay binibigyan ng bukod-tanging tracking reference number'
      }
    ],
    sections: [
      {
        title: { en: 'Required documents per welfare module', ph: 'Mga kailangang dokumento sa bawat programa' },
        paragraphs: [
          {
            en: 'For AICS Medical Assistance: Clinical Abstract or Medical Certificate, Hospital Bill or Statement of Account (for Guarantee Letter), Prescription/Laboratory Request, and valid QCitizen ID.',
            ph: 'Para sa AICS Medical Assistance: Clinical Abstract o Medical Certificate, Hospital Bill o Statement of Account (para sa Guarantee Letter), Reseta/Laboratory Request, at balidong QCitizen ID.'
          },
          {
            en: 'For AICS Funeral/Burial Assistance: Registered Death Certificate, Funeral Service Contract, Barangay Indigency Certificate, and valid ID of the claimant.',
            ph: 'Para sa AICS Funeral/Burial Assistance: Registered Death Certificate, Kontrata sa Punerarya, Barangay Indigency Certificate, at balidong ID ng nagki-claim.'
          },
          {
            en: 'For PWD, Senior Citizen, Solo Parent, and Educational Aid: Valid sectoral ID (PWD ID, OSCA Senior ID, or Solo Parent ID) and Certificate of Enrollment (COE) or School Registration Form for educational grants.',
            ph: 'Para sa PWD, Senior Citizen, Solo Parent, at Educational Aid: Balidong sectoral ID (PWD ID, OSCA Senior ID, o Solo Parent ID) at Certificate of Enrollment (COE) para sa tulong pang-edukasyon.'
          }
        ]
      },
      {
        title: { en: 'Duplicate claim prevention & cooldown rules', ph: 'Pag-iwas sa dobleng claim at cooldown rules' },
        paragraphs: [
          {
            en: 'To ensure equitable distribution of city funds, the system enforces a 6-month cooldown lock on repeat AICS Medical Assistance claims for the same beneficiary, and prevents multiple active enrollments in Vocational Skills Training.',
            ph: 'Upang matiyak ang patas na pamamahagi ng pondo ng lungsod, ipinapatupad ng system ang 6-month cooldown lock sa paulit-ulit na AICS Medical Assistance claim, at pinipigilan ang sabay-sabay na enrollment sa Vocational Skills Training.'
          }
        ]
      }
    ]
  },
  {
    id: 'eligibility-evaluation',
    title: { en: 'Beneficiary Eligibility & Case Evaluation Policy', ph: 'Beneficiary Eligibility & Case Evaluation Policy' },
    shortTitle: { en: 'Eligibility Policy', ph: 'Polisiya sa Kwalipikasyon' },
    category: { en: 'Program Guidelines', ph: 'Mga Alituntunin ng Programa' },
    summary: {
      en: 'How MSWDO social workers evaluate citizen applications, sectoral IDs, and household socio-economic profiles across all welfare modules.',
      ph: 'Paano sinusuri ng mga MSWDO social worker ang aplikasyon ng mamamayan, sectoral ID, at socio-economic profile sa lahat ng programa.'
    },
    keyPoints: [
      {
        en: 'Open to bona fide residents of Quezon City across all 6 districts',
        ph: 'Bukas para sa mga lehitimong residente ng Quezon City sa lahat ng 6 na distrito'
      },
      {
        en: 'Registered Social Workers (RSW) review every case before approval',
        ph: 'Sinusuri ng Registered Social Worker (RSW) ang bawat kaso bago aprubahan'
      },
      {
        en: 'Skills Training courses enforce a strict 25-applicant slot limit per batch',
        ph: 'May 25-applicant slot limit bawat batch ang mga kurso sa Skills Training'
      },
      {
        en: 'Clear reasons are provided whenever an application requires resubmission',
        ph: 'May malinaw na dahilan kapag kailangang ulitin o dagdagan ang dokumento'
      }
    ],
    sections: [
      {
        title: { en: 'Social worker assessment & validation', ph: 'Pagsusuri at beripikasyon ng social worker' },
        paragraphs: [
          {
            en: 'Every application submitted through the portal is queued for review by an authorized MSWDO evaluator. The evaluator checks the authenticity of uploaded IDs, verifies sectoral registry numbers, and determines the appropriate benefit tier or assistance amount.',
            ph: 'Ang bawat aplikasyong ipinapasa sa portal ay pumipila para sa pagsusuri ng awtorisadong MSWDO evaluator. Sinusuri ng evaluator ang katotohanan ng mga in-upload na ID, bene-verify ang sectoral registry number, at tinutukoy ang nararapat na halaga ng tulong.'
          }
        ]
      },
      {
        title: { en: 'Slot capacity and orientation requirements', ph: 'Kapasidad ng slot at pangangailangan sa oryentasyon' },
        paragraphs: [
          {
            en: 'Vocational Skills Training courses enforce a maximum capacity of 25 trainees per course batch based on allotted program budgets. Applicants must complete the scheduled in-person orientation before final enrollment approval.',
            ph: 'Ang mga kurso sa Vocational Skills Training ay may limitasyong 25 trainees bawat batch batay sa nakalaang badyet. Kailangang dumalo ng aplikante sa itinakdang in-person orientation bago ang final enrollment approval.'
          }
        ]
      }
    ]
  },
  {
    id: 'aid-disbursement',
    title: { en: 'Financial Aid Disbursement & Guarantee Letter Policy', ph: 'Financial Aid Disbursement & Guarantee Letter Policy' },
    shortTitle: { en: 'Aid & Disbursements', ph: 'Tulong at Payout' },
    category: { en: 'Aid & Disbursements', ph: 'Tulong at Payout' },
    summary: {
      en: 'How Hospital and Funeral Guarantee Letters (GL), cash subsidies, and educational grants are scheduled, released, and recorded.',
      ph: 'Paano itinatakda, inilalabas, at itinatala ang Hospital at Funeral Guarantee Letters (GL), cash subsidies, at educational grants.'
    },
    keyPoints: [
      {
        en: 'Hospital bills above ₱10,000 are issued an official Guarantee Letter (GL)',
        ph: 'Ang hospital bill na lampas ₱10,000 ay binibigyan ng opisyal na Guarantee Letter (GL)'
      },
      {
        en: 'Payout schedules and venues are posted in your portal and sent via email',
        ph: 'Ang iskedyul at lugar ng payout ay makikita sa portal at ipinapadala sa email'
      },
      {
        en: 'Every released payout is recorded with an official disbursement reference',
        ph: 'Bawat nailabas na tulong ay nakatala na may opisyal na disbursement reference'
      },
      {
        en: 'GovServe SSM is 100% free — no processing fees are ever collected',
        ph: 'Libre ang GovServe SSM — walang anumang bayad na sinisingil sa pagproseso'
      }
    ],
    sections: [
      {
        title: { en: 'Guarantee Letters (GL) vs. Direct Cash Assistance', ph: 'Guarantee Letter (GL) at Direktang Tulong Pinansyal' },
        paragraphs: [
          {
            en: 'For AICS Medical and Funeral cases involving accredited partner hospitals or funeral homes, MSWDO issues a verifiable Guarantee Letter (GL) addressed directly to the service provider. Direct cash subsidies and pensions are released during scheduled district payouts.',
            ph: 'Para sa AICS Medical at Funeral cases sa mga accredited na ospital o punerarya, naglalabas ang MSWDO ng Guarantee Letter (GL) na nakapangalan sa ospital o punerarya. Ang direktang cash subsidy at pension ay ibinibigay sa itinakdang district payout.'
          }
        ]
      },
      {
        title: { en: 'Claiming requirements & payout schedules', ph: 'Mga kailangan sa pag-claim at iskedyul ng payout' },
        paragraphs: [
          {
            en: 'Beneficiaries must present their valid QCitizen ID or government-issued ID and their application reference number on the scheduled release date shown in the Financial Aid Disbursements tab.',
            ph: 'Kailangang ipakita ng benepisyaryo ang kanyang balidong QCitizen ID o government ID at ang application reference number sa itinakdang petsa ng release na makikita sa Financial Aid Disbursements tab.'
          },
          {
            en: 'GovServe Social Services Management never charges any fee to process applications or release financial assistance.',
            ph: 'Kailanman ay hindi naniningil ng anumang bayad ang GovServe Social Services Management sa pagproseso ng aplikasyon o paglalabas ng tulong pinansyal.'
          }
        ]
      }
    ]
  }
];

function estimateReadMinutes(doc: LegalDoc, langKey: 'en' | 'ph'): number {
  const words = [
    doc.summary[langKey],
    ...doc.sections.flatMap((s) => [
      s.title[langKey],
      ...s.paragraphs.map((p) => p[langKey]),
      ...(s.items || []).map((i) => i.text[langKey])
    ])
  ]
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

/* ============================================================================
   INTERACTIVE PARTICLE CANVAS BACKGROUND (Desktop + Mobile Optimized)
   ============================================================================ */
const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: 0, y: 0, active: false };
    const colors = ['#38bdf8', '#818cf8', '#34d399', '#60a5fa', '#fbbf24'];

    const maxParticles = width < 768 ? 34 : 60;
    const count = Math.min(maxParticles, Math.floor((width * height) / 18000));

    const particles = Array.from({ length: count }, () => {
      const r = 2.2 * Math.random() + 1.2;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0.5 * (Math.random() - 0.5),
        vy: 0.5 * (Math.random() - 0.5),
        radius: r,
        baseRadius: r,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    });

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    let rafId = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (dist < 125) {
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.16 * (1 - dist / 125)})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0 && dist < 120) {
            const force = (120 - dist) / 120;
            p.x -= (dx / dist) * force * 2.2;
            p.y -= (dy / dist) * force * 2.2;
            p.radius = p.baseRadius + 1.8 * force;
          } else {
            p.radius = p.baseRadius;
          }
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen print:hidden"
    />
  );
};

/* ============================================================================
   MAIN LANDING VIEW COMPONENT
   ============================================================================ */
export const LandingView: React.FC<LandingViewProps> = ({ onAccessPortal }) => {
  const { language, setLanguage } = useLanguage();
  const langKey: 'en' | 'ph' = language === 'Tagalog' ? 'ph' : 'en';
  const tr = (en: string, ph: string) => (langKey === 'en' ? en : ph);

  // Sync sub-page & legal doc with URL bar
  const parseLocationState = (): { page: PublicPage; docId: string | null } => {
    try {
      const path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
      if (path === '/mobile-app') return { page: 'mobile-app', docId: null };
      if (path === '/announcements') return { page: 'announcements', docId: null };
      if (path === '/how-it-works') return { page: 'how-it-works', docId: null };
      if (path === '/legal' || path === '/legals') return { page: 'legal', docId: null };
      if (path.startsWith('/legal/') || path.startsWith('/legals/')) {
        const parts = path.split('/');
        const slug = parts[parts.length - 1] || null;
        return { page: 'legal', docId: slug };
      }
    } catch {}
    return { page: 'home', docId: null };
  };

  const initialLoc = parseLocationState();
  const [currentPage, setCurrentPage] = useState<PublicPage>(initialLoc.page);
  const [activeDocId, setActiveDocId] = useState<string | null>(initialLoc.docId);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [legalSearch, setLegalSearch] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  // Announcements state
  const [announcements, setAnnouncements] = useState<
    {
      id: string;
      level: 'Payout Schedule' | 'Orientation Notice' | 'Program Advisory' | 'General Alert';
      title: BilingualText;
      body: BilingualText;
      created_at: string;
    }[]
  >([
    {
      id: 'ssm-adv-1',
      level: 'Payout Schedule',
      title: {
        en: 'Q4 Financial Subsidy & Social Pension Payout Schedule for District 1–6 Beneficiaries',
        ph: 'Iskedyul ng Payout para sa Q4 Financial Subsidy at Social Pension ng District 1–6'
      },
      body: {
        en: 'Approved beneficiaries under PWD, Senior Citizen, and Solo Parent Cash Subsidy programs may check their exact release date and venue under the Financial Aid Disbursements tab. Please bring your valid QCitizen ID and application reference number.',
        ph: 'Maaaring tingnan ng mga aprubadong benepisyaryo sa ilalim ng PWD, Senior Citizen, at Solo Parent Cash Subsidy ang kanilang eksaktong petsa at lugar ng payout sa Financial Aid Disbursements tab. Dalhin ang inyong QCitizen ID at application reference number.'
      },
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: 'ssm-adv-2',
      level: 'Orientation Notice',
      title: {
        en: 'Mandatory In-Person Orientation for Newly Enrolled Vocational Skills Training Applicants',
        ph: 'Mandatory In-Person Orientation para sa mga Bagong Aplikante ng Vocational Skills Training'
      },
      body: {
        en: 'All applicants with "Orientation Scheduled" status under Livelihood & Skills Training must attend the orientation at the Quezon City SSDD Training Center. Each batch is strictly capped at 25 slots per course.',
        ph: 'Lahat ng aplikanteng may status na "Orientation Scheduled" sa Livelihood & Skills Training ay kailangang dumalo sa oryentasyon sa Quezon City SSDD Training Center. Limitado sa 25 slots bawat kurso ang bawat batch.'
      },
      created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
    },
    {
      id: 'ssm-adv-3',
      level: 'Program Advisory',
      title: {
        en: 'AICS Hospital & Funeral Guarantee Letter (GL) Digital Verification Guidelines',
        ph: 'Alituntunin sa Digital Verification ng AICS Hospital at Funeral Guarantee Letter (GL)'
      },
      body: {
        en: 'For hospital bills exceeding ₱10,000, an official Guarantee Letter (GL) is issued upon social worker approval. Ensure your Statement of Account, Clinical Abstract, and QCitizen ID are clearly uploaded for same-day evaluation.',
        ph: 'Para sa hospital bill na lampas ₱10,000, naglalabas ng opisyal na Guarantee Letter (GL) matapos ang pag-apruba ng social worker. Tiyaking malinaw ang pagkaka-upload ng Statement of Account, Clinical Abstract, at QCitizen ID.'
      },
      created_at: new Date(Date.now() - 2 * 86400 * 1000).toISOString()
    },
    {
      id: 'ssm-adv-4',
      level: 'General Alert',
      title: {
        en: 'Certificate of Enrollment (COE) Requirement for Solo Parent & Child Welfare Educational Aid',
        ph: 'Pangangailangan ng Certificate of Enrollment (COE) para sa Educational Aid'
      },
      body: {
        en: 'Parents and guardians applying for Educational Assistance must upload the current school year Certificate of Enrollment (COE) or official school registration form after ID verification.',
        ph: 'Ang mga magulang at guardian na nag-a-apply sa Educational Assistance ay kailangang mag-upload ng kasalukuyang Certificate of Enrollment (COE) o opisyal na registration form matapos ang beripikasyon ng ID.'
      },
      created_at: new Date(Date.now() - 4 * 86400 * 1000).toISOString()
    }
  ]);

  useEffect(() => {
    const onPopState = () => {
      const next = parseLocationState();
      setCurrentPage(next.page);
      setActiveDocId(next.docId);
      setMobileMenuOpen(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = (page: PublicPage, docId: string | null = null, scrollToId?: string) => {
    setMobileMenuOpen(false);
    setCurrentPage(page);
    setActiveDocId(docId);

    try {
      let targetPath = '/';
      if (page === 'mobile-app') targetPath = '/mobile-app';
      else if (page === 'announcements') targetPath = '/announcements';
      else if (page === 'how-it-works') targetPath = '/how-it-works';
      else if (page === 'legal') targetPath = docId ? `/legal/${docId}` : '/legal';

      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    } catch {}

    if (scrollToId) {
      setTimeout(() => {
        const el = document.getElementById(scrollToId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Core 6 Capabilities (Without AI card — strictly our 6 Social Services modules/capabilities)
  const coreCapabilities = [
    {
      icon: <HeartHandshake className="w-[18px] h-[18px]" />,
      title: tr('AICS Crisis Assistance', 'Tulong sa Krisis (AICS)'),
      description: tr(
        'Immediate medical Guarantee Letters (GL) and funeral/burial assistance for Quezon City families in crisis.',
        'Agarang medical Guarantee Letter (GL) at tulong sa pagpapalibing para sa mga pamilyang nasa krisis.'
      )
    },
    {
      icon: <Users className="w-[18px] h-[18px]" />,
      title: tr('PWD & Senior Citizen Welfare', 'Kapakanan ng PWD at Senior Citizen'),
      description: tr(
        'Direct financial subsidies, social pension applications, and assistive support for vulnerable sectors.',
        'Direktang tulong pinansyal, aplikasyon sa social pension, at suporta para sa mga PWD at Senior Citizen.'
      )
    },
    {
      icon: <UserCheck className="w-[18px] h-[18px]" />,
      title: tr('Solo Parent Welfare & Aid', 'Tulong para sa Solo Parent'),
      description: tr(
        'Cash subsidy and dedicated educational grants for registered Solo Parents using verified ID numbers.',
        'Cash subsidy at tulong pang-edukasyon para sa mga rehistradong Solo Parent gamit ang beripikadong ID.'
      )
    },
    {
      icon: <GraduationCap className="w-[18px] h-[18px]" />,
      title: tr('Child Welfare & Educational Aid', 'Kalinga sa Bata at Tulong Pang-Edukasyon'),
      description: tr(
        'Confidential child protection intake services and educational assistance with COE validation.',
        'Kumpidensyal na serbisyo sa proteksyon ng bata at educational assistance na may beripikasyon ng COE.'
      )
    },
    {
      icon: <Briefcase className="w-[18px] h-[18px]" />,
      title: tr('Livelihood & Skills Training', 'Pangkabuhayan at Skills Training'),
      description: tr(
        'Livelihood seed capital grants and free vocational skills training with orientation scheduling.',
        'Puhunang pangkabuhayan at libreng vocational skills training na may iskedyul ng oryentasyon.'
      )
    },
    {
      icon: <Calendar className="w-[18px] h-[18px]" />,
      title: tr('Appointments & Aid Disbursement', 'Iskedyul at Pamamahagi ng Tulong'),
      description: tr(
        'Real-time tracking of social worker case reviews, orientation schedules, Guarantee Letters, and cash payouts.',
        'Real-time na pagsubaybay sa pagsusuri ng social worker, iskedyul ng oryentasyon, Guarantee Letter, at payout.'
      )
    }
  ];

  const statsList = [
    { value: '100%', label: tr('Digital Process', 'Digital na Proseso') },
    { value: '24/7', label: tr('System Access', 'Access sa Sistema') },
    { value: '5', label: tr('Core Welfare Modules', 'Pangunahing Programa') },
    { value: 'Real-time', label: tr('Updates', 'Mga Update') }
  ];

  const navItems: { page: PublicPage; label: string }[] = [
    { page: 'home', label: tr('Home', 'Tahanan') },
    { page: 'mobile-app', label: tr('Mobile app', 'Mobile App') },
    { page: 'announcements', label: tr('Announcements', 'Mga Anunsyo') },
    { page: 'how-it-works', label: tr('How It Works', 'Paano Ito Gumagana') },
    { page: 'legal', label: tr('Legals', 'Legals') }
  ];

  const footerColumns = [
    {
      icon: <LayoutGrid className="w-4 h-4" />,
      title: tr('Features', 'Mga Serbisyo'),
      links: coreCapabilities.map((item) => ({
        label: item.title,
        onClick: () => navigateTo('home', null, 'features')
      }))
    },
    {
      icon: <UserCheck className="w-4 h-4" />,
      title: tr('System Access', 'Access sa Sistema'),
      links: [
        { label: tr('Sign In', 'Mag-sign In'), onClick: onAccessPortal },
        {
          label: tr('Download Mobile App', 'I-download ang Mobile App'),
          onClick: () => navigateTo('mobile-app')
        },
        {
          label: tr('How It Works', 'Paano Ito Gumagana'),
          onClick: () => navigateTo('how-it-works')
        },
        {
          label: tr('Announcements', 'Mga Anunsyo'),
          onClick: () => navigateTo('announcements')
        }
      ]
    },
    {
      icon: <ShieldCheck className="w-4 h-4" />,
      title: tr('Legals', 'Legals'),
      links: [
        ...LEGAL_DOCS.map((doc) => ({
          label: doc.title[langKey],
          onClick: () => navigateTo('legal', doc.id)
        })),
        {
          label: tr('All legal documents', 'Lahat ng legal na dokumento'),
          onClick: () => navigateTo('legal', null)
        }
      ]
    }
  ];

  const filteredLegalDocs = useMemo(() => {
    const terms = legalSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return LEGAL_DOCS;
    return LEGAL_DOCS.filter((doc) => {
      const haystack = [
        doc.title.en,
        doc.title.ph,
        doc.category.en,
        doc.category.ph,
        doc.summary.en,
        doc.summary.ph,
        ...doc.keyPoints.flatMap((k) => [k.en, k.ph]),
        ...doc.sections.flatMap((s) => [
          s.title.en,
          s.title.ph,
          ...s.paragraphs.flatMap((p) => [p.en, p.ph])
        ])
      ]
        .join(' ')
        .toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [legalSearch]);

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const containerClass =
    'mx-auto w-[calc(100%-32px)] sm:w-[min(1180px,calc(100%-40px))] 2xl:w-[min(1360px,calc(100%-64px))]';

  return (
    <div
      style={{
        fontFamily: '"Segoe UI", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif'
      }}
      className="relative flex min-h-screen flex-col bg-[#f8fafc] text-[16px] leading-[1.6] text-[#1e293b] antialiased selection:bg-blue-500/30 print:bg-white"
    >
      {/* Interactive Floating Particle Canvas */}
      <ParticleBackground />

      {/* ======================================================================
         STICKY WHITE PUBLIC NAVBAR (Desktop Pill Nav + CP Hamburger Menu)
         ====================================================================== */}
      <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-white/95 backdrop-blur-md print:hidden">
        <div
          className={`${containerClass} flex items-center justify-between gap-x-3 py-[11.2px] lg:grid lg:grid-cols-[1fr_auto_1fr]`}
        >
          {/* Left: Logo + GOVSERVE + Social Services Management */}
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="flex min-w-0 items-center gap-[11.2px] justify-self-start text-left cursor-pointer"
          >
            <img
              src="/Government Service Integrity Seal.png"
              alt="GovServe Logo"
              className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-full border border-[#e2e8f0] object-cover shadow-[0_1px_2px_rgba(15,44,89,0.05)] bg-white"
            />
            <span className="text-[15px] sm:text-[16px] font-semibold leading-[1.35] text-[#1e293b]">
              GOVSERVE
              <small className="block max-w-[190px] sm:max-w-[210px] text-[11px] sm:text-[12px] font-normal leading-[1.35] text-[#5b6b7f] truncate sm:whitespace-normal">
                {tr('Social Services Management', 'Pamamahala sa Serbisyong Panlipunan')}
              </small>
            </span>
          </button>

          {/* Center: Desktop Pill Navigation */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center justify-center gap-[4px] justify-self-center"
          >
            {navItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  type="button"
                  onClick={() => navigateTo(item.page)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`whitespace-nowrap rounded-full px-[13.6px] py-[8px] text-[14.4px] leading-[1.6] transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#1870d51f] font-semibold text-[#1870d5]'
                      : 'font-medium text-[#1e293b] hover:bg-[#1870d514]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Language Switcher + Sign In + CP Hamburger Button */}
          <div className="flex items-center gap-[8px] justify-self-end">
            {/* Language Switcher Pill */}
            <div
              role="group"
              aria-label="Language: English or Filipino"
              className="flex items-center gap-[4px] rounded-full border border-[#e2e8f0] bg-white px-[4px] py-[2.9px]"
            >
              <Globe
                className="ml-[4px] mr-[1.6px] hidden w-4 h-4 text-[#5b6b7f] sm:block"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setLanguage('English')}
                aria-pressed={langKey === 'en'}
                className={`rounded-full px-[8.5px] sm:px-[9.6px] py-[5.4px] text-[12px] sm:text-[12.5px] font-semibold leading-none transition-colors cursor-pointer ${
                  langKey === 'en'
                    ? 'bg-[#1870d5] text-white'
                    : 'text-[#5b6b7f] hover:bg-[#eaf2fd] hover:text-[#0f2c59]'
                }`}
              >
                <span className="sm:hidden">EN</span>
                <span className="hidden sm:inline">English</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('Tagalog')}
                aria-pressed={langKey === 'ph'}
                className={`rounded-full px-[8.5px] sm:px-[9.6px] py-[5.4px] text-[12px] sm:text-[12.5px] font-semibold leading-none transition-colors cursor-pointer ${
                  langKey === 'ph'
                    ? 'bg-[#1870d5] text-white'
                    : 'text-[#5b6b7f] hover:bg-[#eaf2fd] hover:text-[#0f2c59]'
                }`}
              >
                <span className="sm:hidden">FIL</span>
                <span className="hidden sm:inline">Filipino</span>
              </button>
            </div>

            {/* Sign In Button (Desktop & Tablet) */}
            <button
              type="button"
              onClick={onAccessPortal}
              className="hidden sm:inline-flex rounded-full bg-[#1870d5] px-[14px] py-[7px] text-[13.4px] font-semibold leading-tight text-white shadow-[0_6px_18px_-6px_#1870d58c] transition-colors hover:bg-[#1563bb] cursor-pointer"
            >
              {tr('Sign In', 'Mag-sign In')}
            </button>

            {/* Cellphone / Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="inline-flex lg:hidden h-10 w-10 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#0f2c59] hover:bg-[#eaf2fd] transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Cellphone (CP) Dropdown Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#e2e8f0] bg-white/98 backdrop-blur-md px-4 pt-3 pb-4 shadow-[0_18px_36px_-18px_rgba(15,44,89,0.18)] animate-fade-in">
            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => {
                const isActive = currentPage === item.page;
                return (
                  <button
                    key={item.page}
                    type="button"
                    onClick={() => navigateTo(item.page)}
                    className={`w-full text-left rounded-xl px-4 py-2.5 text-[14.5px] transition-colors flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-[#1870d51f] font-semibold text-[#1870d5]'
                        : 'font-medium text-[#1e293b] hover:bg-[#1870d510]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight
                      className={`w-4 h-4 ${isActive ? 'text-[#1870d5]' : 'text-[#94a3b8]'}`}
                    />
                  </button>
                );
              })}
            </nav>

            <div className="mt-3 pt-3 border-t border-[#eef2f7] flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onAccessPortal();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#1870d5] py-2.5 px-5 text-[14.5px] font-semibold text-white shadow-[0_8px_20px_-6px_#1870d599] hover:bg-[#1563bb] cursor-pointer"
              >
                <span>{tr('Sign In', 'Mag-sign In')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ======================================================================
         MAIN PAGE CONTENT SWITCHER
         ====================================================================== */}
      <main className="relative z-10 flex-1">
        {/* --------------------------------------------------------------------
           PAGE 1: HOME PAGE
           -------------------------------------------------------------------- */}
        {currentPage === 'home' && (
          <div className="animate-fade-in">
            {/* Hero Section */}
            <section
              className="relative overflow-hidden border-b border-[#e2e8f0] pt-[36px] pb-[22.4px] md:pt-[clamp(52px,7vw,96px)]"
              style={{
                backgroundImage: [
                  'radial-gradient(620px 420px at 76% 12%, rgba(24, 112, 213, 0.12), transparent 68%)',
                  'radial-gradient(500px 320px at 8% 0%, rgba(241, 196, 15, 0.08), transparent 68%)',
                  'linear-gradient(180deg, #f8fbff 0%, #f8fafc 100%)'
                ].join(', ')
              }}
            >
              {/* Subtle Grid Overlay */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  opacity: 0.45,
                  backgroundImage:
                    'linear-gradient(rgba(15, 44, 89, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 44, 89, 0.035) 1px, transparent 1px)',
                  backgroundSize: '72px 72px',
                  maskImage: 'linear-gradient(90deg, rgba(0, 0, 0, 0.8), transparent 85%)',
                  WebkitMaskImage: 'linear-gradient(90deg, rgba(0, 0, 0, 0.8), transparent 85%)'
                }}
              />

              <div
                className={`${containerClass} relative z-10 grid grid-cols-1 items-center gap-[32px] lg:grid-cols-[minmax(0,0.96fr)_minmax(400px,0.84fr)] lg:gap-[clamp(40px,6vw,96px)]`}
              >
                {/* Left Hero Column */}
                <div className="max-w-[720px] lg:max-w-[640px]">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#1870d52e] bg-[#ffffffb3] px-[14px] py-[10px] text-[11px] sm:text-[11.5px] font-extrabold uppercase leading-none tracking-[0.13em] text-[#0f2c59] shadow-[0_8px_24px_#0f2c590f]">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-[#1870d5]" aria-hidden="true" />
                    {tr('Government Services Management', 'Pamamahala ng Serbisyo ng Gobyerno')}
                  </span>

                  <h1 className="mt-[22px] mb-[18px] max-w-[13ch] font-extrabold leading-[1.02] tracking-[-0.055em] text-[#0f2c59] text-[clamp(38px,11vw,58px)] md:text-[clamp(48px,5.8vw,84px)]">
                    {tr('Social Services,', 'Serbisyong Panlipunan,')}{' '}
                    <em className="block not-italic text-[#1870d5] mt-1">
                      {tr('beautifully simple.', 'simple at maganda.')}
                    </em>
                  </h1>

                  <p className="max-w-[54ch] text-[15.5px] sm:text-[17.5px] leading-[1.7] text-[#5b6b7f]">
                    {tr(
                      'Streamline AICS medical and burial assistance, PWD and Senior Citizen welfare benefits, Solo Parent and Child Welfare support, and Livelihood training all in one unified platform.',
                      'Pabilisin ang AICS medical at burial assistance, benepisyo ng PWD at Senior Citizen, suporta sa Solo Parent at Child Welfare, at Livelihood training — lahat sa iisang plataporma.'
                    )}
                  </p>

                  <div className="mt-[28px] flex flex-wrap gap-[12px]">
                    <button
                      type="button"
                      onClick={onAccessPortal}
                      className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#1870d5] px-[27px] py-[13.5px] text-[16px] font-semibold leading-tight text-white shadow-[0_14px_30px_-12px_#1870d5a6] transition-colors hover:bg-[#1563bb] cursor-pointer"
                    >
                      <span>{tr('Sign In', 'Mag-sign In')}</span>
                      <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-[2px]" />
                    </button>
                  </div>

                  {/* Download Mobile App Mini Card */}
                  <button
                    type="button"
                    onClick={() => navigateTo('mobile-app')}
                    className="mt-[20px] grid w-full max-w-[432px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[11.2px] rounded-[14px] border border-[#2563eb29] bg-[#ffffffbd] px-[13.1px] py-[11.5px] text-left text-[#0f2c59] shadow-[0_16px_32px_-28px_#0f2c59cc] transition hover:translate-y-[-2px] hover:border-[#2563eb59] hover:shadow-[0_20px_36px_-26px_#0f2c59b3] cursor-pointer"
                  >
                    <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-[linear-gradient(145deg,#1870d5,#0f2c59)] text-white shadow-[0_8px_16px_-10px_#2563ebe6]">
                      <Smartphone className="w-4 h-4" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-[12.8px] leading-[1.2]">
                        {tr('Download Mobile App', 'I-download ang Mobile App')}
                      </strong>
                      <small className="mt-[3.2px] block text-[11.2px] leading-[1.4] text-[#5b6b7f]">
                        {tr('APK for Android 8.0 or higher', 'APK para sa Android 8.0 pataas')}
                      </small>
                    </span>
                    <Download className="w-4 h-4 text-[#1870d5]" />
                  </button>
                </div>

                {/* Right Tilted Preview Card (Responsive on CP & Desktop) */}
                <div
                  aria-hidden="true"
                  className="relative grid min-h-[330px] sm:min-h-[380px] lg:min-h-[460px] select-none place-items-center"
                >
                  <div
                    className="pointer-events-none absolute right-[1%] top-[8%] h-[280px] w-[280px] sm:h-[360px] sm:w-[360px] rounded-full animate-landing-orb"
                    style={{
                      background:
                        'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.95), rgba(207, 226, 252, 0.7) 45%, rgba(157, 193, 236, 0.15) 72%, transparent 73%)'
                    }}
                  />
                  <div className="pointer-events-none absolute bottom-[4%] left-[4%] h-[110px] w-[110px] rounded-full border border-[#1870d52e] shadow-[inset_0_0_0_14px_#ffffff4d]" />

                  {/* Main Tilted Glass Card */}
                  <div className="relative z-10 w-[94%] sm:w-[min(410px,86%)] rotate-1 sm:rotate-2 rounded-[18px] border border-[#ffffffe6] bg-[#ffffffd9] p-[14px] sm:p-[18.4px] shadow-[0_30px_80px_-28px_#0f2c5961,0_0_0_8px_#ffffff3d] backdrop-blur-[18px] animate-landing-card-in">
                    <div className="flex items-center justify-between border-b border-[#eef2f7] pb-[14px]">
                      <span className="inline-flex items-center gap-[6.4px] text-[11.5px] font-bold text-[#067647]">
                        <span className="h-[6px] w-[6px] rounded-full bg-current shadow-[0_0_0_4px_#ecfdf3]" />
                        {tr('24/7 System Access', '24/7 na Access sa Sistema')}
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.08em] text-[#5b6b7f]">
                        GOVSERVE / SSM
                      </span>
                    </div>

                    <div className="flex items-center gap-[12px] px-[3.2px] pt-[18px] pb-[14px]">
                      <span className="grid h-[43px] w-[43px] shrink-0 place-items-center rounded-[14px] bg-[#1870d51f] text-[#1870d5]">
                        <HeartHandshake className="w-5 h-5" />
                      </span>
                      <div className="grid gap-[2px]">
                        <span className="text-[13px] text-[#5b6b7f]">
                          {tr(
                            'Social Services Management',
                            'Pamamahala sa Serbisyong Panlipunan'
                          )}
                        </span>
                        <strong className="text-[16px] sm:text-[16.8px] leading-[1.3] text-[#0f2c59]">
                          {tr('All in one unified platform', 'Lahat sa iisang plataporma')}
                        </strong>
                      </div>
                    </div>

                    <div className="grid gap-[8px]">
                      {coreCapabilities.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-[11px] rounded-[14px] border border-transparent bg-[#f8fbff] px-[11.2px] py-[11px] text-[13px] sm:text-[13.4px] font-semibold text-[#1e293b]"
                        >
                          <span className="font-mono text-[11.2px] font-bold text-[#1870d5]">
                            0{idx + 1}
                          </span>
                          <span className="flex-1 truncate">{item.title}</span>
                          <ArrowRight className="w-4 h-4 text-[#1870d5] shrink-0" />
                        </div>
                      ))}
                    </div>

                    <div className="mt-[14px] flex items-center justify-end gap-[12px] border-t border-[#eef2f7] pt-[12px] text-[10.7px] text-[#5b6b7f]">
                      <span>
                        {tr(
                          '100% Digital Process · Real-time Updates',
                          '100% Digital na Proseso · Real-time na Update'
                        )}
                      </span>
                      <span className="grid h-[26px] w-[26px] shrink-0 place-items-center overflow-hidden rounded-full border border-[#f6e6a6] bg-[#fdf6d9]">
                        <img
                          src="/Government Service Integrity Seal.png"
                          alt=""
                          className="h-[22px] w-[22px] object-contain"
                        />
                      </span>
                    </div>
                  </div>

                  {/* Top-Right Floating Mini Badge */}
                  <div className="absolute z-20 right-0 top-[2%] sm:top-[10%] flex min-w-[140px] sm:min-w-[164px] items-center gap-[9.6px] rounded-[14px] border border-[#ffffffe6] bg-[#ffffffe6] p-[8.8px] sm:px-[12.8px] sm:py-[11.2px] shadow-[0_18px_40px_-24px_#0f2c598c] backdrop-blur-[12px] animate-landing-float">
                    <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px] bg-[#eaf2fd] text-[#1870d5]">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <span>
                      <strong className="block text-[11px] sm:text-[12.5px] text-[#0f2c59]">
                        {tr('Aid & Payout Tracking', 'Pagsubaybay sa Payout')}
                      </strong>
                      <small className="mt-[2px] block text-[9.8px] sm:text-[10.9px] text-[#5b6b7f]">
                        {tr('GL & cash release updates', 'Update sa GL at tulong')}
                      </small>
                    </span>
                  </div>

                  {/* Bottom-Left Floating Mini Badge */}
                  <div className="absolute z-20 bottom-[2%] sm:bottom-[8%] left-0 flex min-w-[140px] sm:min-w-[164px] items-center gap-[9.6px] rounded-[14px] border border-[#ffffffe6] bg-[#ffffffe6] p-[8.8px] sm:px-[12.8px] sm:py-[11.2px] shadow-[0_18px_40px_-24px_#0f2c598c] backdrop-blur-[12px] animate-landing-float-reverse">
                    <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px] bg-[#fdf6d9] text-[#8a6a08]">
                      <Users className="w-4 h-4" />
                    </span>
                    <span>
                      <strong className="block text-[11px] sm:text-[12.5px] text-[#0f2c59]">
                        {tr('Citizen Portal', 'Portal ng Mamamayan')}
                      </strong>
                      <small className="mt-[2px] block text-[9.8px] sm:text-[10.9px] text-[#5b6b7f]">
                        {tr('Personal dashboard', 'Personal na dashboard')}
                      </small>
                    </span>
                  </div>
                </div>
              </div>

              {/* 4-Column Stats Bar (2x2 on CP, 4 columns on Desktop) */}
              <div
                className={`${containerClass} relative z-10 mt-[clamp(36px,5vw,72px)] grid grid-cols-2 border-t border-[#e2e8f0] md:grid-cols-4`}
              >
                {statsList.map((stat, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-[auto_1fr] items-baseline gap-x-[10.4px] border-[#e2e8f0] px-[10.4px] py-[14.4px] md:py-[17.6px] md:pr-[16px] ${
                      idx === 0 ? 'md:pl-0' : 'md:pl-[17.6px]'
                    } ${
                      idx === 0 || idx === 2 ? 'border-r' : idx === 1 ? 'md:border-r' : ''
                    } ${idx < 2 ? 'border-b md:border-b-0' : ''}`}
                  >
                    <span className="row-span-2 font-mono text-[10.2px] font-bold text-[#1870d5]">
                      0{idx + 1}
                    </span>
                    <strong className="text-[21px] sm:text-[23.2px] leading-none tracking-[-0.04em] text-[#0f2c59]">
                      {stat.value}
                    </strong>
                    <span className="text-[11.5px] text-[#5b6b7f]">{stat.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Core Capabilities Grid (01 to 06 — Without AI Card) */}
            <section
              id="features"
              className="relative scroll-mt-[90px] bg-white py-[clamp(56px,7vw,104px)]"
            >
              <div className={containerClass}>
                <div className="mb-[34px] max-w-[660px]">
                  <span className="inline-flex items-center gap-2 text-[11.5px] font-extrabold uppercase leading-none tracking-[0.13em] text-[#0f2c59]">
                    {tr('Features', 'Mga Serbisyo')}
                  </span>
                  <h2 className="mt-[12px] mb-[10.4px] max-w-[20ch] text-[clamp(28px,3.6vw,48px)] font-semibold leading-[1.2] tracking-[-0.045em] text-[#0f2c59]">
                    {tr(
                      'Complete Social Services Management Suite',
                      'Kumpletong Sistema sa Pamamahala ng Serbisyong Panlipunan'
                    )}
                  </h2>
                  <p className="max-w-[54ch] text-[15.5px] sm:text-[16px] leading-[1.6] text-[#5b6b7f]">
                    {tr(
                      'Everything you need to apply for, verify, and track Quezon City social welfare and financial assistance programs.',
                      'Lahat ng kailangan para mag-apply, mag-beripika, at sumubaybay sa mga programa ng serbisyong panlipunan at tulong pinansyal.'
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[18px] border border-[#e2e8f0] bg-[#e2e8f0] md:grid-cols-2 lg:grid-cols-3">
                  {coreCapabilities.map((item, idx) => (
                    <article
                      key={idx}
                      className="relative flex min-h-[240px] flex-col bg-white p-[24px] transition duration-200 hover:z-10 hover:translate-y-[-3px] hover:bg-[#fbfdff]"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-[10.9px] font-bold tracking-[0.08em] text-[#1870d5]">
                          0{idx + 1}
                        </span>
                        <span className="grid h-[38.4px] w-[38.4px] place-items-center rounded-[10px] bg-[#1870d51f] text-[#1870d5]">
                          {item.icon}
                        </span>
                      </div>
                      <h3 className="mt-[34px] mb-[8px] text-[19px] font-semibold leading-[1.22] tracking-[-0.015em] text-[#0f2c59]">
                        {item.title}
                      </h3>
                      <p className="mb-[16px] max-w-[32ch] text-[14.4px] leading-[1.6] text-[#5b6b7f]">
                        {item.description}
                      </p>
                      <span className="mt-auto h-[2px] w-12 bg-gradient-to-r from-[#1870d5] to-[#f1c40f]" />
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {/* Mobile App Promo Banner */}
            <section className="relative bg-white pt-[8px] pb-[clamp(56px,7vw,96px)]">
              <div className={containerClass}>
                <div className="grid grid-cols-1 items-center gap-[20px] rounded-[18px] border border-[#2563eb29] bg-[linear-gradient(120deg,#f6faff,#edf5ff_57%,#fff9ec)] p-[clamp(18.4px,3vw,26.4px)] shadow-[0_24px_56px_-42px_#0f2c59c7] sm:grid-cols-[auto_minmax(0,1fr)] md:grid-cols-[auto_minmax(0,1fr)_auto]">
                  <div className="grid h-[58px] w-[58px] place-items-center rounded-[18px] bg-[linear-gradient(145deg,#1870d5,#0f2c59)] text-white shadow-[0_8px_16px_-10px_#2563ebe6]">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-2 text-[11.5px] font-extrabold uppercase leading-none tracking-[0.13em] text-[#0f2c59]">
                      {tr('Mobile app', 'Mobile App')}
                    </span>
                    <h2 className="my-[5.6px] text-[clamp(23px,3vw,34px)] font-semibold leading-[1.22] tracking-[-0.035em] text-[#0f2c59]">
                      {tr(
                        'Social Services and Aid in Your Pocket',
                        'Serbisyo at Tulong, Hawak Mo'
                      )}
                    </h2>
                    <p className="max-w-[57ch] text-[14.4px] leading-[1.6] text-[#5b6b7f]">
                      {tr(
                        'Download the official GovServe mobile app to apply for welfare programs, check orientation schedules, and track Guarantee Letters and payouts on your phone.',
                        'I-download ang opisyal na GovServe mobile app para makapag-apply sa mga programa, makita ang iskedyul ng oryentasyon, at masubaybayan ang Guarantee Letter at payout sa phone mo.'
                      )}
                    </p>
                    <div className="mt-[12px] flex flex-wrap gap-x-[17.6px] gap-y-[10px] text-[11.5px] font-bold text-[#0f2c59]">
                      <span className="inline-flex items-center gap-[5px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#1870d5]" />
                        {tr('Official GovServe app', 'Opisyal na GovServe app')}
                      </span>
                      <span className="inline-flex items-center gap-[5px]">
                        <Smartphone className="w-3.5 h-3.5 text-[#1870d5]" />
                        {tr('Android 8.0 or higher', 'Android 8.0 pataas')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo('mobile-app')}
                    className="group inline-flex w-full sm:col-span-2 sm:w-auto sm:justify-self-start md:col-span-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#1870d5] px-[25px] py-[13px] text-[15.5px] font-semibold leading-tight text-white shadow-[0_14px_30px_-12px_#1870d5a6] transition-colors hover:bg-[#1563bb] cursor-pointer"
                  >
                    <span>{tr('Download Mobile App', 'I-download ang Mobile App')}</span>
                    <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-[2px]" />
                  </button>
                </div>
              </div>
            </section>

            {/* Dark-Blue Citizen Portal CTA Section */}
            <section className="relative pt-[8px] pb-[clamp(56px,7vw,96px)]">
              <div
                className={`${containerClass} relative flex flex-col items-start gap-[28px] rounded-[18px] bg-[linear-gradient(120deg,#0d2b58,#17447e_58%,#2469ad)] p-[clamp(28px,5vw,60px)] shadow-[0_28px_70px_-34px_#0f2c59a6] md:flex-row md:items-center md:justify-between`}
              >
                <div>
                  <span className="inline-flex items-center gap-2 text-[11.5px] font-extrabold uppercase leading-none tracking-[0.13em] text-[#a9c9ef]">
                    {tr('Citizen Portal', 'Portal ng Mamamayan')}
                  </span>
                  <h2 className="mt-[11px] mb-[9.6px] max-w-[18ch] text-[clamp(26px,3vw,42px)] font-semibold leading-[1.2] tracking-tight text-white">
                    {tr(
                      'A personal welfare dashboard for every constituent.',
                      'Personal na dashboard ng serbisyo para sa bawat mamamayan.'
                    )}
                  </h2>
                  <p className="max-w-[50ch] text-[15.5px] leading-[1.6] text-[#cfe0f6]">
                    {tr(
                      'Fast and reliable online application for AICS medical/burial aid, PWD, Senior Citizen, Solo Parent, Child Welfare, and Livelihood programs.',
                      'Mabilis at maaasahang online na aplikasyon para sa AICS medical/burial aid, PWD, Senior Citizen, Solo Parent, Child Welfare, at Livelihood programs.'
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onAccessPortal}
                  className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-[27px] py-[13.5px] text-[16px] font-semibold leading-tight text-[#0f2c59] transition-colors hover:bg-[#eef5ff] cursor-pointer"
                >
                  <span>{tr('Sign In', 'Mag-sign In')}</span>
                  <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-[2px]" />
                </button>
              </div>
            </section>
          </div>
        )}

        {/* --------------------------------------------------------------------
           PAGE 2: MOBILE APP PAGE
           -------------------------------------------------------------------- */}
        {currentPage === 'mobile-app' && (
          <div className="animate-fade-in">
            <section className="py-8 md:py-[40px]">
              <div className={containerClass}>
                <span className="inline-flex items-center gap-[6px] rounded-full border border-[#1870d52e] bg-white px-[12px] py-[4px] text-[11.8px] font-semibold text-[#0f2c59] shadow-[0_6px_18px_-12px_#0f2c5966]">
                  <Smartphone className="w-[13px] h-[13px] text-[#1870d5]" />
                  {tr('Mobile app', 'Mobile App')}
                </span>
                <h1 className="mt-[16px] text-[clamp(26px,calc(18.4px+2vw),40px)] font-bold leading-[1.15] tracking-[-0.03em] text-[#0f2c59]">
                  {tr('Social Services and Aid in', 'Serbisyo at Tulong,')}{' '}
                  <span className="text-[#1870d5]">{tr('Your Pocket', 'Hawak Mo')}</span>
                </h1>
                <p className="mt-[16px] max-w-[62ch] text-[15.5px] sm:text-[16px] leading-[1.6] text-[#5b6b7f]">
                  {tr(
                    'Download the official GovServe Social Services mobile app to apply for AICS, PWD, Senior Citizen, Solo Parent, Educational, and Livelihood programs, check orientation schedules, and track payouts on your Android phone.',
                    'I-download ang opisyal na GovServe Social Services mobile app para makapag-apply sa AICS, PWD, Senior Citizen, Solo Parent, Educational, at Livelihood programs, makita ang iskedyul ng oryentasyon, at masubaybayan ang payout sa iyong Android phone.'
                  )}
                </p>
              </div>
            </section>

            {/* Download Card + What's in the App */}
            <section className="py-4 md:py-[20px]">
              <div className={`${containerClass} grid grid-cols-1 lg:grid-cols-2 gap-[16px]`}>
                {/* Left: APK Download Card */}
                <article
                  id="download"
                  className="relative overflow-hidden rounded-[18px] border border-[#e2e8f0] bg-white scroll-mt-[120px]"
                >
                  <div className="relative bg-[linear-gradient(120deg,#0d2b58,#17447e_58%,#2469ad)] px-[22px] pt-[22px] pb-[54px]">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute right-[-40px] top-[-60px] h-[180px] w-[180px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16),transparent_70%)]"
                    />
                    <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-[10px] py-[2px] text-[11.5px] font-semibold text-[#cfe0f6]">
                      {tr('Version 1.0.0 · build 1', 'Bersyon 1.0.0 · build 1')}
                    </span>
                  </div>

                  <div className="relative px-[22px] pb-[22px]">
                    <div className="mt-[-36px] flex items-start gap-4">
                      <span className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-[20px] border-4 border-white bg-white shadow-[0_14px_30px_-14px_#0f2c5999]">
                        <img
                          src="/Government Service Integrity Seal.png"
                          alt="GSSM Logo"
                          className="h-14 w-14 object-contain"
                        />
                      </span>
                      <div className="pt-11">
                        <h2 className="text-[21px] sm:text-[23px] font-bold leading-[1.2] tracking-[-0.015em] text-[#0f2c59]">
                          GSSM
                        </h2>
                        <p className="text-[13px] text-[#5b6b7f]">
                          {tr(
                            'GovServe Social Services app for Android',
                            'GovServe Social Services app para sa Android'
                          )}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-[18px] grid grid-cols-2 gap-[10px] text-[13px]">
                      <div className="rounded-[12px] bg-[#eef2f7] px-[12px] py-[9px]">
                        <dt className="text-[11.5px] text-[#5b6b7f]">
                          {tr('File type', 'Uri ng file')}
                        </dt>
                        <dd className="font-semibold text-[#0f2c59]">Android APK</dd>
                      </div>
                      <div className="rounded-[12px] bg-[#eef2f7] px-[12px] py-[9px]">
                        <dt className="text-[11.5px] text-[#5b6b7f]">Package</dt>
                        <dd className="font-mono text-[12px] font-semibold text-[#0f2c59] truncate">
                          com.govserve.ssm
                        </dd>
                      </div>
                    </dl>

                    <button
                      type="button"
                      onClick={onAccessPortal}
                      className="mt-[18px] flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-[#1870d5] px-[18px] py-[13px] text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_#1870d5a6] transition-colors hover:bg-[#1563bb] cursor-pointer"
                    >
                      <Download className="w-[18px] h-[18px]" />
                      <span>
                        {tr('Download APK for Android', 'I-download ang APK para sa Android')}
                      </span>
                    </button>

                    <p className="mt-[12px] flex items-start gap-2 text-[12.5px] leading-normal text-[#5b6b7f]">
                      <ShieldCheck className="mt-[2px] w-[15px] h-[15px] shrink-0 text-[#067647]" />
                      {tr(
                        'Official Quezon City Social Services mobile package for Android devices.',
                        'Opisyal na Quezon City Social Services mobile package para sa mga Android device.'
                      )}
                    </p>
                  </div>
                </article>

                {/* Right: What's in the app */}
                <article className="relative overflow-hidden rounded-[18px] border border-[#e2e8f0] bg-white p-[22px]">
                  <h3 className="text-[17px] font-semibold leading-[1.22] text-[#0f2c59]">
                    {tr("What's in the app", 'Ano ang nasa app')}
                  </h3>
                  <p className="mt-[6px] text-[13.5px] text-[#5b6b7f]">
                    {tr(
                      'The same screens as the web portal, made for your phone.',
                      'Parehong mga screen ng web portal, ginawa para sa phone mo.'
                    )}
                  </p>

                  <div className="mt-[18px] grid gap-4">
                    {[
                      {
                        icon: <Users className="w-4 h-4" />,
                        title: tr('For citizens', 'Para sa mamamayan'),
                        items: [
                          tr(
                            'Personal Social Services Dashboard',
                            'Personal na Social Services Dashboard'
                          ),
                          tr(
                            'AICS Medical & Burial Assistance Application',
                            'Aplikasyon sa AICS Medical at Burial Assistance'
                          ),
                          tr(
                            'PWD, Senior Citizen, Solo Parent & Child Welfare',
                            'PWD, Senior Citizen, Solo Parent at Child Welfare'
                          ),
                          tr(
                            'Appointments & Financial Aid Disbursement Tracker',
                            'Tracker ng Appointment at Financial Aid Payout'
                          )
                        ]
                      },
                      {
                        icon: <Briefcase className="w-4 h-4" />,
                        title: tr('For MSWDO staff', 'Para sa kawani ng MSWDO'),
                        items: [
                          tr(
                            'Application Verification & Case Review',
                            'Beripikasyon ng Aplikasyon at Case Review'
                          ),
                          tr(
                            'Guarantee Letter (GL) & Payroll Release',
                            'Paglalabas ng Guarantee Letter (GL) at Payroll'
                          ),
                          tr(
                            'Orientation & Appointment Scheduling',
                            'Pagtatakda ng Oryentasyon at Appointment'
                          ),
                          tr(
                            'Beneficiary Masterlist & Activity Audit Log',
                            'Beneficiary Masterlist at Activity Audit Log'
                          )
                        ]
                      }
                    ].map((group) => (
                      <div
                        key={group.title}
                        className="rounded-[14px] border border-[#eef2f7] bg-[#fbfdff] p-4"
                      >
                        <div className="flex items-center gap-[10px]">
                          <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-[#eaf2fd] text-[#1870d5]">
                            {group.icon}
                          </span>
                          <strong className="text-[14px] text-[#0f2c59]">{group.title}</strong>
                        </div>
                        <ul className="mt-[10px] grid gap-2 sm:grid-cols-2">
                          {group.items.map((it) => (
                            <li
                              key={it}
                              className="flex items-start gap-2 text-[13px] leading-[1.45] text-[#1e293b]"
                            >
                              <CheckCircle2 className="mt-[2px] w-4 h-4 shrink-0 text-[#1870d5]" />
                              <span>{it}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>

            {/* System Requirements & Installing on Android */}
            <section className="py-6 md:py-[32px]">
              <div className={`${containerClass} grid grid-cols-1 lg:grid-cols-2 gap-[16px]`}>
                <article className="relative overflow-hidden rounded-[18px] border border-[#e2e8f0] bg-white p-[22px]">
                  <h3 className="text-[17px] font-semibold leading-[1.22] text-[#0f2c59]">
                    {tr('System requirements', 'Mga kailangan')}
                  </h3>
                  <ul className="mt-[16px] grid gap-[12px]">
                    {[
                      {
                        icon: <Smartphone className="w-[18px] h-[18px]" />,
                        title: tr('Android 8.0 (Oreo) or higher', 'Android 8.0 (Oreo) pataas'),
                        note: tr(
                          'Compatible with Android smartphones and tablets.',
                          'Gumagana sa mga Android smartphone at tablet.'
                        )
                      },
                      {
                        icon: <HardDrive className="w-[18px] h-[18px]" />,
                        title: tr(
                          'At least 50 MB free space',
                          'Hindi bababa sa 50 MB na bakanteng espasyo'
                        ),
                        note: tr(
                          'For the app and saved document uploads.',
                          'Para sa app at sa mga ia-upload na dokumento.'
                        )
                      },
                      {
                        icon: <Wifi className="w-[18px] h-[18px]" />,
                        title: tr('Internet connection', 'Koneksyon sa internet'),
                        note: tr(
                          'Needed to submit applications, check status updates, and view payout schedules.',
                          'Kailangan para magpasa ng aplikasyon, tumingin ng status, at makita ang payout schedule.'
                        )
                      },
                      {
                        icon: <UserCheck className="w-[18px] h-[18px]" />,
                        title: tr('A GovServe account', 'GovServe account'),
                        note: tr(
                          'The same citizen or MSWDO staff account you use on the web portal.',
                          'Parehong citizen o MSWDO staff account na gamit mo sa web portal.'
                        )
                      }
                    ].map((req) => (
                      <li key={req.title} className="flex items-start gap-[12px]">
                        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] bg-[#eaf2fd] text-[#1870d5]">
                          {req.icon}
                        </span>
                        <span>
                          <strong className="block text-[14px] leading-[1.35] text-[#0f2c59]">
                            {req.title}
                          </strong>
                          <span className="text-[13px] leading-normal text-[#5b6b7f]">
                            {req.note}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="relative overflow-hidden rounded-[18px] border border-[#e2e8f0] bg-white p-[22px]">
                  <h3 className="text-[17px] font-semibold leading-[1.22] text-[#0f2c59]">
                    {tr('Installing on Android', 'Pag-install sa Android')}
                  </h3>
                  <ol className="mt-[16px] grid gap-[4px]">
                    {[
                      tr(
                        'Tap Download APK and open the file when it finishes downloading.',
                        'I-tap ang Download APK at buksan ang file kapag tapos nang ma-download.'
                      ),
                      tr(
                        'If Android asks, allow installs from your browser.',
                        'Kung magtanong ang Android, payagan ang pag-install mula sa browser mo.'
                      ),
                      tr(
                        'Open GSSM and sign in with your GovServe account.',
                        'Buksan ang GSSM at mag-sign in gamit ang GovServe account mo.'
                      ),
                      tr(
                        'Allow camera and storage permissions so you can photograph and attach your QCitizen ID, medical bills, or Certificate of Enrollment.',
                        'Payagan ang camera at storage permissions para makuhanan at mailakip ang iyong QCitizen ID, medical bill, o Certificate of Enrollment.'
                      )
                    ].map((stepText, idx, arr) => (
                      <li key={idx} className="relative flex gap-4 pb-4 last:pb-0">
                        {idx < arr.length - 1 && (
                          <span
                            aria-hidden="true"
                            className="absolute left-[16px] top-[34px] bottom-0 w-px bg-[#e2e8f0]"
                          />
                        )}
                        <span className="relative grid h-[33px] w-[33px] shrink-0 place-items-center rounded-full border border-[#1870d540] bg-white font-mono text-[12px] font-bold text-[#1870d5]">
                          0{idx + 1}
                        </span>
                        <p className="pt-[6px] text-[13.5px] leading-[1.55] text-[#1e293b]">
                          {stepText}
                        </p>
                      </li>
                    ))}
                  </ol>
                </article>
              </div>
            </section>
          </div>
        )}

        {/* --------------------------------------------------------------------
           PAGE 3: ANNOUNCEMENTS PAGE
           -------------------------------------------------------------------- */}
        {currentPage === 'announcements' && (
          <div className="animate-fade-in">
            <section className="py-8 md:py-[40px]">
              <div className={containerClass}>
                <span className="inline-block rounded-full bg-[#eaf2fd] px-[10.4px] py-[2.4px] text-[11.8px] font-semibold text-[#0f2c59]">
                  {tr('Official Advisories', 'Mga Opisyal na Abiso')}
                </span>
                <h1 className="mt-[12px] text-[clamp(24px,calc(18.4px+1.5vw),33.6px)] font-semibold leading-[1.22] tracking-[-0.015em] text-[#0f2c59]">
                  {tr('Announcements', 'Mga Anunsyo')}
                </h1>
                <p className="mt-[8px] max-w-[60ch] text-[15px] text-[#5b6b7f]">
                  {tr(
                    'Official Quezon City MSWDO payout schedules, vocational training orientation dates, and social welfare program advisories.',
                    'Mga opisyal na iskedyul ng payout, petsa ng oryentasyon sa skills training, at abiso sa mga programa ng Quezon City MSWDO.'
                  )}
                </p>

                <ul className="mt-[20px] grid gap-4">
                  {announcements.map((item) => {
                    const badgeConfig =
                      item.level === 'Payout Schedule'
                        ? {
                            en: 'Payout Schedule',
                            ph: 'Iskedyul ng Payout',
                            cls: 'border-[#06764733] bg-[#ecfdf3] text-[#067647]'
                          }
                        : item.level === 'Orientation Notice'
                        ? {
                            en: 'Orientation Notice',
                            ph: 'Abiso sa Oryentasyon',
                            cls: 'border-[#f6e6a6] bg-[#fdf6d9] text-[#8a6a08]'
                          }
                        : item.level === 'Program Advisory'
                        ? {
                            en: 'Program Advisory',
                            ph: 'Abiso sa Programa',
                            cls: 'border-[#1870d538] bg-[#eaf2fd] text-[#0f2c59]'
                          }
                        : {
                            en: 'General Alert',
                            ph: 'Pangkalahatang Abiso',
                            cls: 'border-[#e2e8f0] bg-[#f1f5f9] text-[#5b6b7f]'
                          };

                    return (
                      <li
                        key={item.id}
                        className="relative isolate flex flex-col gap-[11px] overflow-hidden rounded-[18px] border border-[#e2e8f0] bg-[linear-gradient(165deg,#f5f9fe_0%,#ffffff_55%)] px-[19px] pt-[18px] pb-[18px] shadow-[0_1px_2px_rgba(15,44,89,0.05)] transition duration-200 hover:border-[#1870d552] hover:shadow-[0_22px_46px_-28px_#0f2c5961] hover:translate-y-[-2px]"
                      >
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,#1870d5,#bbaf40)] opacity-85"
                        />
                        <div className="flex flex-wrap items-center gap-[6px]">
                          <span
                            className={`inline-flex items-center gap-[5px] rounded-full border px-[10px] py-[3px] text-[11.5px] font-bold tracking-[0.015em] ${badgeConfig.cls}`}
                          >
                            <Bell className="w-[13px] h-[13px]" />
                            {tr(badgeConfig.en, badgeConfig.ph)}
                          </span>
                        </div>

                        <h2 className="text-[16.6px] font-bold leading-[1.35] tracking-[-0.01em] text-[#0f2c59]">
                          {item.title[langKey]}
                        </h2>

                        <p className="text-[14.2px] leading-[1.55] text-[#5b6b7f]">
                          {item.body[langKey]}
                        </p>

                        <div className="mt-[2px] flex flex-wrap items-center gap-[6px] border-t border-dashed border-[#eef2f7] pt-[10px] text-[12.5px] text-[#5b6b7f]">
                          <Clock className="w-4 h-4 shrink-0 opacity-75" />
                          <time dateTime={item.created_at}>
                            {new Date(item.created_at).toLocaleString(
                              langKey === 'en' ? 'en-PH' : 'fil-PH',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              }
                            )}
                          </time>
                          <span aria-hidden="true">·</span>
                          <span>
                            {tr(
                              'Quezon City MSWDO Official Broadcast',
                              'Opisyal na Anunsyo ng Quezon City MSWDO'
                            )}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          </div>
        )}

        {/* --------------------------------------------------------------------
           PAGE 4: HOW IT WORKS PAGE
           -------------------------------------------------------------------- */}
        {currentPage === 'how-it-works' && (
          <div className="animate-fade-in">
            <section className="py-[28px] md:py-[40px]">
              <div className={containerClass}>
                <span className="inline-block rounded-full bg-[#eaf2fd] px-[10.4px] py-[2.4px] text-[11.8px] font-semibold text-[#0f2c59]">
                  {tr('How it works', 'Paano ito gumagana')}
                </span>
                <h1 className="mt-[16px] text-[clamp(24px,calc(18.4px+1.5vw),33.6px)] font-semibold leading-[1.22] tracking-[-0.015em] text-[#0f2c59]">
                  {tr(
                    'From application to assistance, in four steps',
                    'Mula aplikasyon hanggang tulong, sa apat na hakbang'
                  )}
                </h1>
                <p className="mt-[16px] mb-[16px] max-w-[58ch] text-[16px] leading-[1.6] text-[#5b6b7f]">
                  {tr(
                    'Streamline AICS medical and burial assistance, PWD and Senior Citizen welfare benefits, Solo Parent and Child Welfare support, and Livelihood training all in one unified platform.',
                    'Pabilisin ang AICS medical at burial assistance, benepisyo ng PWD at Senior Citizen, suporta sa Solo Parent at Child Welfare, at Livelihood training — lahat sa iisang plataporma.'
                  )}
                </p>
              </div>
            </section>

            {/* 4 Step Cards */}
            <section className="py-[12px] md:py-[24px]">
              <div
                className={`${containerClass} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[16px]`}
              >
                {[
                  {
                    step: '01',
                    title: tr(
                      'Sign in & verify your QCitizen profile',
                      'Mag-sign in at i-verify ang iyong QCitizen profile'
                    ),
                    description: tr(
                      'Sign in to your citizen account and verify your QCitizen ID or sectoral ID so your personal details are ready for any welfare program.',
                      'Mag-sign in sa iyong citizen account at i-verify ang iyong QCitizen ID o sectoral ID para handa na ang iyong personal na detalye.'
                    )
                  },
                  {
                    step: '02',
                    title: tr(
                      'Choose a program & upload requirements',
                      'Pumili ng programa at i-upload ang requirements'
                    ),
                    description: tr(
                      'Select AICS (Medical/Funeral), PWD, Senior Citizen, Solo Parent, Child Welfare/Educational, or Livelihood & Skills Training and attach clear photos of your documents.',
                      'Piliin ang AICS (Medical/Funeral), PWD, Senior Citizen, Solo Parent, Child Welfare/Educational, o Livelihood & Skills Training at ilakip ang malinaw na larawan ng iyong mga dokumento.'
                    )
                  },
                  {
                    step: '03',
                    title: tr(
                      'Follow every update & schedule',
                      'Subaybayan ang bawat update at iskedyul'
                    ),
                    description: tr(
                      'Application History shows each step in real time: Pending Document Validation, Approved, Orientation Scheduled, and Ready for Release.',
                      'Makikita sa Application History ang bawat hakbang: Pending Document Validation, Approved, Orientation Scheduled, at Ready for Release.'
                    )
                  },
                  {
                    step: '04',
                    title: tr(
                      'Claim your Guarantee Letter or Financial Aid',
                      'Kunin ang iyong Guarantee Letter o Financial Aid'
                    ),
                    description: tr(
                      'Download your approved Hospital/Funeral Guarantee Letter (GL) or present your QCitizen ID and reference number at the scheduled district payout.',
                      'I-download ang iyong aprubadong Hospital/Funeral Guarantee Letter (GL) o ipakita ang iyong QCitizen ID at reference number sa itinakdang payout.'
                    )
                  }
                ].map((item) => (
                  <article
                    key={item.step}
                    className="relative rounded-[14px] border border-[#e2e8f0] bg-white p-[20px] shadow-[0_1px_2px_rgba(15,44,89,0.04)]"
                  >
                    <span className="inline-block font-mono text-[11px] font-bold text-[#1870d5] bg-[#eaf2fd] px-2.5 py-0.5 rounded-full mb-3">
                      Step {item.step}
                    </span>
                    <h3 className="text-[17px] font-semibold leading-[1.22] tracking-[-0.015em] text-[#0f2c59]">
                      {item.title}
                    </h3>
                    <p className="mt-[12px] mb-2 text-[14px] leading-[1.6] text-[#5b6b7f]">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            {/* Ready to start CTA */}
            <section className="py-[28px] md:py-[40px]">
              <div className={containerClass}>
                <div className="relative rounded-[14px] border border-[#e2e8f0] bg-white p-[22px] sm:p-[28px]">
                  <h2 className="text-[21px] sm:text-[23px] font-semibold leading-[1.22] tracking-[-0.015em] text-[#0f2c59]">
                    {tr('Ready to start?', 'Handa ka na ba?')}
                  </h2>
                  <p className="mt-[12px] text-[14px] leading-[1.6] text-[#5b6b7f]">
                    {tr(
                      'Sign in to submit an application, or download the mobile app first.',
                      'Mag-sign in para magpasa ng aplikasyon, o i-download muna ang mobile app.'
                    )}
                  </p>
                  <div className="mt-[16px] flex flex-wrap gap-[12px]">
                    <button
                      type="button"
                      onClick={onAccessPortal}
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-[7.2px] whitespace-nowrap rounded-full border border-transparent bg-[#1870d5] px-[18px] py-[9.5px] text-[14.9px] font-semibold leading-tight text-white shadow-[0_6px_18px_-6px_#1870d58c] transition-colors hover:bg-[#1563bb] cursor-pointer"
                    >
                      {tr('Sign In', 'Mag-sign In')}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('mobile-app')}
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-[7.2px] whitespace-nowrap rounded-full border border-[#e2e8f0] bg-white px-[18px] py-[9.5px] text-[14.9px] font-semibold leading-tight text-[#0f2c59] transition-colors hover:border-[#1870d5] hover:bg-[#eaf2fd] cursor-pointer"
                    >
                      {tr('Download Mobile App', 'I-download ang Mobile App')}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* --------------------------------------------------------------------
           PAGE 5: LEGALS PAGE (Overview & Individual Document Reader)
           -------------------------------------------------------------------- */}
        {currentPage === 'legal' && (
          <div className="animate-fade-in">
            {activeDocId ? (
              /* INDIVIDUAL LEGAL DOCUMENT READER VIEW */
              (() => {
                const doc = LEGAL_DOCS.find((d) => d.id === activeDocId) || LEGAL_DOCS[0];
                const docIndex = LEGAL_DOCS.indexOf(doc);
                const prevDoc = LEGAL_DOCS[docIndex - 1];
                const nextDoc = LEGAL_DOCS[docIndex + 1];
                const docUrl = `${window.location.origin}/legal/${doc.id}`;
                const readMins = estimateReadMinutes(doc, langKey);

                return (
                  <section className="pt-8 pb-12">
                    <div className="mx-auto w-[min(1088px,calc(100%-32px))] flex flex-col">
                      {/* Breadcrumb & Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-[12px] print:hidden">
                        <nav
                          aria-label="Breadcrumb"
                          className="flex min-w-0 flex-wrap items-center gap-[8px] text-[14px] leading-[1.6]"
                        >
                          <button
                            type="button"
                            onClick={() => navigateTo('legal', null)}
                            className="text-[#5b6b7f] underline underline-offset-2 transition-colors hover:text-[#1870d5] cursor-pointer"
                          >
                            ← {tr('Legal documents', 'Mga legal na dokumento')}
                          </button>
                          <span className="text-[#5b6b7f]" aria-hidden="true">
                            /
                          </span>
                          <span className="text-[#1e293b] font-medium" aria-current="page">
                            {doc.title[langKey]}
                          </span>
                        </nav>

                        <div className="flex items-center gap-[8px]">
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(docUrl)}
                            className="inline-flex items-center justify-center gap-[7.2px] whitespace-nowrap rounded-full border border-[#e2e8f0] bg-white px-[11.2px] py-[4.8px] text-[13.12px] font-semibold leading-tight text-[#5b6b7f] transition-colors hover:border-[#1870d580] hover:text-[#1870d5] cursor-pointer"
                          >
                            {copyStatus === 'copied' ? (
                              <Check className="h-3.5 w-3.5 text-[#067647]" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            <span>
                              {copyStatus === 'copied'
                                ? tr('Link copied', 'Nakopya ang link')
                                : tr('Copy link', 'Kopyahin ang link')}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center justify-center gap-[7.2px] whitespace-nowrap rounded-full border border-[#e2e8f0] bg-white px-[11.2px] py-[4.8px] text-[13.12px] font-semibold leading-tight text-[#5b6b7f] transition-colors hover:border-[#1870d580] hover:text-[#1870d5] cursor-pointer"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>{tr('Print', 'I-print')}</span>
                          </button>
                        </div>
                      </div>

                      {/* Horizontal Document Pill Switcher */}
                      <nav
                        aria-label={tr('Legal documents', 'Mga legal na dokumento')}
                        className="relative mt-[16px] flex gap-[8px] overflow-x-auto rounded-full border border-[#e2e8f0] bg-[#f1f5f9] p-[5.6px] no-scrollbar print:hidden"
                      >
                        <button
                          type="button"
                          onClick={() => navigateTo('legal', null)}
                          className="flex shrink-0 items-center gap-[7.2px] whitespace-nowrap rounded-full px-[16px] py-[7.2px] text-[13.6px] font-semibold leading-[1.6] text-[#5b6b7f] hover:bg-white hover:text-[#0f2c59] transition-colors cursor-pointer"
                        >
                          <BookOpen className="h-4 w-4" />
                          <span>{tr('All documents', 'Lahat ng dokumento')}</span>
                        </button>
                        {LEGAL_DOCS.map((d) => {
                          const isCurrent = d.id === doc.id;
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => navigateTo('legal', d.id)}
                              className={`flex shrink-0 items-center gap-[7.2px] whitespace-nowrap rounded-full px-[16px] py-[7.2px] text-[13.6px] font-semibold leading-[1.6] transition-colors cursor-pointer ${
                                isCurrent
                                  ? 'bg-[#1870d5] text-white shadow-[0_1px_2px_rgba(15,44,89,0.05)]'
                                  : 'text-[#5b6b7f] hover:bg-white hover:text-[#0f2c59]'
                              }`}
                            >
                              {d.shortTitle[langKey]}
                            </button>
                          );
                        })}
                      </nav>

                      {/* Document Header Card */}
                      <div className="relative overflow-hidden rounded-[18px] border border-[#e2e8f0] bg-white bg-[linear-gradient(135deg,rgba(15,44,89,0.05),rgba(24,112,213,0.08))] shadow-[0_1px_2px_rgba(15,44,89,0.04),0_10px_28px_rgba(15,44,89,0.06)] mt-[16px] flex flex-col gap-[16px] px-[20px] py-[24px] md:px-[32px] md:py-8">
                        <div className="flex flex-wrap items-center gap-[8px]">
                          <span className="inline-block rounded-full bg-[#eaf2fd] px-[8.8px] py-[2.4px] text-[12px] font-semibold leading-[1.6] text-[#1870d5]">
                            {doc.category[langKey]}
                          </span>
                          <span className="inline-block rounded-[6px] border border-[#e2e8f0] bg-[#f1f5f9] px-[8px] py-[2.4px] text-[12px] font-bold leading-[1.6] text-[#5b6b7f]">
                            {tr(
                              `Document ${docIndex + 1} of ${LEGAL_DOCS.length}`,
                              `Dokumento ${docIndex + 1} sa ${LEGAL_DOCS.length}`
                            )}
                          </span>
                        </div>

                        <div>
                          <h1 className="text-[clamp(24px,calc(18px+1.6vw),33.6px)] font-semibold leading-[1.22] tracking-[-0.015em] text-[#0f2c59]">
                            {doc.title[langKey]}
                          </h1>
                          <p className="mt-[6px] max-w-[760px] text-[15.5px] leading-[1.6] text-[#5b6b7f]">
                            {doc.summary[langKey]}
                          </p>
                        </div>

                        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.8px] leading-[1.6] text-[#5b6b7f]">
                          <span>
                            <strong className="font-bold">{tr('Version:', 'Bersyon:')}</strong> 1.0
                          </span>
                          <span>
                            •{' '}
                            <strong className="font-bold">
                              {tr('Last updated:', 'Huling update:')}
                            </strong>{' '}
                            2026-10-30
                          </span>
                          <span className="inline-flex items-center gap-1">
                            • <Clock className="h-3.5 w-3.5" /> {readMins}{' '}
                            {tr('min read', 'minutong basa')}
                          </span>
                          <span>
                            •{' '}
                            <strong className="font-bold">
                              {tr('Prepared by:', 'Inihanda ng:')}
                            </strong>{' '}
                            GovServe SSM Team
                          </span>
                        </p>
                      </div>

                      {/* 2-Column Outline + Full Sections */}
                      <div className="mt-[24px] grid grid-cols-1 gap-[24px] lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-[40px]">
                        {/* Left Sidebar: Outline + Key Highlights */}
                        <aside className="flex flex-col gap-[20px] self-start print:hidden lg:sticky lg:top-[84px]">
                          <nav
                            aria-labelledby="legal-outline-title"
                            className="flex flex-col gap-[12px] rounded-[14px] border border-[#e2e8f0] bg-white p-[20px] shadow-[0_1px_2px_rgba(15,44,89,0.05)]"
                          >
                            <h2
                              id="legal-outline-title"
                              className="flex items-center gap-[7.2px] text-[13.6px] font-bold uppercase leading-[1.22] tracking-[0.06em] text-[#0f2c59]"
                            >
                              <BookOpen className="h-4 w-4 shrink-0 text-[#1870d5]" />
                              {tr('Document outline', 'Balangkas ng dokumento')}
                            </h2>
                            <ol className="flex flex-col gap-[5.6px]">
                              {doc.sections.map((sec, idx) => (
                                <li key={idx}>
                                  <a
                                    href={`#section-${idx + 1}`}
                                    className="block rounded-[10px] px-[10.4px] py-[6.4px] text-[13.44px] leading-[1.35] text-[#5b6b7f] transition-colors hover:bg-[#eaf2fd] hover:text-[#1870d5]"
                                  >
                                    {idx + 1}. {sec.title[langKey]}
                                  </a>
                                </li>
                              ))}
                            </ol>
                          </nav>

                          <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-[18.4px]">
                            <h2 className="text-[14px] font-bold leading-[1.6] text-[#0f2c59]">
                              {tr('Key highlights', 'Mahahalagang punto')}
                            </h2>
                            <ul className="mt-[9.6px] flex flex-col gap-[9.6px]">
                              {doc.keyPoints.map((kp, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-[7.2px] text-[12.48px] leading-[1.6] text-[#1e293b]"
                                >
                                  <CheckCircle2 className="mt-[3px] h-4 w-4 shrink-0 text-[#067647]" />
                                  <span>{kp[langKey]}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </aside>

                        {/* Right Column: Article Sections + Prev/Next */}
                        <div className="flex min-w-0 flex-col gap-[24px]">
                          <article className="rounded-[18px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,44,89,0.05)] flex flex-col gap-8 p-[20px] md:p-[40px]">
                            {doc.sections.map((sec, idx) => {
                              const secNum = idx + 1;
                              return (
                                <section
                                  key={secNum}
                                  id={`section-${secNum}`}
                                  className="flex scroll-mt-[90px] flex-col gap-[12px] border-b border-[#eef2f7] pb-8 last:border-b-0 last:pb-0"
                                >
                                  <div className="flex items-center gap-[12px]">
                                    <span className="shrink-0 rounded-[6px] bg-[#eaf2fd] px-[9.6px] py-[3.2px] text-[12.8px] font-bold leading-[1.6] text-[#0f2c59]">
                                      § {secNum}
                                    </span>
                                    <h2 className="text-[18.4px] font-bold leading-[1.22] tracking-[-0.015em] text-[#0f2c59]">
                                      {secNum}. {sec.title[langKey]}
                                    </h2>
                                  </div>

                                  {sec.paragraphs.map((p, pIdx) => (
                                    <p
                                      key={pIdx}
                                      className="text-[15.2px] leading-[1.7] text-[#1e293b]"
                                    >
                                      {p[langKey]}
                                    </p>
                                  ))}

                                  {sec.items && (
                                    <div className="overflow-hidden rounded-[10px] border border-[#e2e8f0]">
                                      <table className="w-full border-collapse text-left">
                                        <tbody className="divide-y divide-[#eef2f7]">
                                          {sec.items.map((it) => (
                                            <tr
                                              key={it.term}
                                              className="block align-top sm:table-row"
                                            >
                                              <th
                                                scope="row"
                                                className="block bg-[#f5f9fe] px-4 pt-[10px] pb-[2px] font-mono text-[12.5px] font-semibold text-[#0f2c59] sm:table-cell sm:w-[220px] sm:py-[10px]"
                                              >
                                                {it.term}
                                              </th>
                                              <td className="block px-4 pt-[2px] pb-[10px] text-[14px] leading-[1.6] text-[#1e293b] sm:table-cell sm:py-[10px]">
                                                {it.text[langKey]}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </section>
                              );
                            })}
                          </article>

                          {/* Previous / Next Document Cards */}
                          <nav className="grid grid-cols-1 gap-[16px] sm:grid-cols-2 print:hidden">
                            {prevDoc ? (
                              <button
                                type="button"
                                onClick={() => navigateTo('legal', prevDoc.id)}
                                className="group flex items-center gap-[16px] rounded-[14px] border border-[#e2e8f0] bg-white p-[20px] text-left shadow-[0_1px_2px_rgba(15,44,89,0.05)] transition-colors hover:border-[#1870d566] cursor-pointer"
                              >
                                <ArrowLeft className="h-5 w-5 shrink-0 text-[#1870d5] transition-transform group-hover:translate-x-[-2px]" />
                                <span className="min-w-0">
                                  <span className="block text-[13px] text-[#5b6b7f]">
                                    {tr('Previous document', 'Nakaraang dokumento')}
                                  </span>
                                  <strong className="block text-[14.72px] font-bold text-[#1e293b] truncate">
                                    {prevDoc.title[langKey]}
                                  </strong>
                                </span>
                              </button>
                            ) : (
                              <span aria-hidden="true" className="hidden sm:block" />
                            )}

                            {nextDoc && (
                              <button
                                type="button"
                                onClick={() => navigateTo('legal', nextDoc.id)}
                                className="group flex items-center justify-between gap-[16px] rounded-[14px] border border-[#1870d54d] bg-[linear-gradient(135deg,#eaf2fd_0%,#fff_100%)] p-[20px] text-left shadow-[0_1px_2px_rgba(15,44,89,0.05)] transition-colors hover:border-[#1870d599] cursor-pointer"
                              >
                                <span className="min-w-0">
                                  <span className="block text-[13px] text-[#5b6b7f]">
                                    {tr('Next document', 'Susunod na dokumento')}
                                  </span>
                                  <strong className="block text-[14.72px] font-bold text-[#1e293b] truncate">
                                    {nextDoc.title[langKey]}
                                  </strong>
                                </span>
                                <ArrowRight className="h-5 w-5 shrink-0 text-[#1870d5] transition-transform group-hover:translate-x-[2px]" />
                              </button>
                            )}
                          </nav>
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })()
            ) : (
              /* LEGAL OVERVIEW LIST VIEW */
              <section className="pt-8 md:pt-[40px] pb-12">
                <div className="mx-auto w-[min(1024px,calc(100%-32px))] flex flex-col">
                  {/* Top Legal Hero Box */}
                  <div className="relative overflow-hidden rounded-[18px] border border-[#e2e8f0] bg-white bg-[linear-gradient(135deg,rgba(15,44,89,0.05),rgba(24,112,213,0.08))] shadow-[0_1px_2px_rgba(15,44,89,0.04),0_10px_28px_rgba(15,44,89,0.06)] flex flex-col gap-[20px] p-6 md:p-[40px]">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(24,112,213,0.16),transparent_68%)]"
                    />
                    <span className="relative inline-flex w-fit items-center gap-[7.2px] rounded-full border border-[#1870d540] bg-[#eaf2fd] px-[12px] py-[4.8px] text-[12px] font-bold uppercase leading-[1.6] tracking-[0.06em] text-[#0f2c59]">
                      <Scale className="h-3.5 w-3.5 shrink-0 text-[#1870d5]" />
                      {tr('Legal & compliance framework', 'Legal at compliance framework')}
                    </span>

                    <div className="relative">
                      <h1 className="text-[clamp(26px,calc(20px+1.6vw),37.6px)] font-semibold leading-[1.22] tracking-[-0.015em] text-[#0f2c59]">
                        {tr(
                          'Terms, privacy & system policies',
                          'Mga patakaran, privacy at polisiya ng system'
                        )}
                      </h1>
                      <p className="mt-[6px] max-w-[768px] text-[15.5px] sm:text-[16.32px] leading-[1.6] text-[#5b6b7f]">
                        {tr(
                          'These documents explain how GovServe Social Services Management works, how your personal information is protected under Republic Act 10173, and the rules for applying for welfare assistance and claiming financial aid.',
                          'Ipinapaliwanag ng mga dokumentong ito kung paano gumagana ang GovServe Social Services Management, paano pinoprotektahan ang iyong personal na impormasyon ayon sa Republic Act 10173, at ang mga patakaran sa pag-apply at pag-claim ng tulong pinansyal.'
                        )}
                      </p>
                    </div>

                    {/* 3 Stat Cards */}
                    <div className="relative my-[8px] grid grid-cols-1 gap-[16px] md:grid-cols-3">
                      {[
                        {
                          icon: <FileText className="h-[22px] w-[22px]" />,
                          tone: 'bg-[#eaf2fd] text-[#1870d5]',
                          value: tr(
                            `${LEGAL_DOCS.length} documents`,
                            `${LEGAL_DOCS.length} na dokumento`
                          ),
                          label: tr('Governing documents', 'Mga namamahalang dokumento')
                        },
                        {
                          icon: <ShieldCheck className="h-[22px] w-[22px]" />,
                          tone: 'bg-[#ecfdf3] text-[#067647]',
                          value: 'RA 10173',
                          label: 'Data Privacy Act of 2012'
                        },
                        {
                          icon: <Lock className="h-[22px] w-[22px]" />,
                          tone: 'bg-[#fdf6d9] text-[#b54708]',
                          value: 'HTTPS',
                          label: tr('Encrypted in transit', 'Naka-encrypt habang ipinapadala')
                        }
                      ].map((st) => (
                        <div
                          key={st.value}
                          className="flex items-center gap-[16px] rounded-[14px] border border-[#e2e8f0] bg-white px-[20px] py-[16px] shadow-[0_1px_2px_rgba(15,44,89,0.05)]"
                        >
                          <span
                            className={`grid h-12 w-12 shrink-0 place-items-center rounded-[10px] ${st.tone}`}
                          >
                            {st.icon}
                          </span>
                          <span className="min-w-0">
                            <strong className="block text-[17.6px] font-bold leading-[1.2] text-[#0f2c59]">
                              {st.value}
                            </strong>
                            <span className="block text-[12.48px] leading-[1.6] text-[#5b6b7f]">
                              {st.label}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Search Bar */}
                    <label className="relative block w-full max-w-[512px]">
                      <span className="sr-only">
                        {tr('Search the legal documents', 'Hanapin sa mga legal na dokumento')}
                      </span>
                      <Search className="pointer-events-none absolute left-[16px] top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#5b6b7f]" />
                      <input
                        type="search"
                        value={legalSearch}
                        onChange={(e) => setLegalSearch(e.target.value)}
                        placeholder={tr(
                          'Search legal topics, data policies, or citizen rights…',
                          'Hanapin ang legal na paksa, datos o karapatan…'
                        )}
                        className="min-h-[48px] w-full rounded-full border border-[#e2e8f0] bg-white py-[12px] pl-[41.6px] pr-[16px] text-[14.72px] text-[#1e293b] outline-none transition placeholder:text-[#5b6b7f] focus:border-[#1870d5] focus:shadow-[0_0_0_3px_rgba(24,112,213,0.15)]"
                      />
                    </label>
                  </div>

                  {/* Governing Documents Heading */}
                  <div className="mt-[20px] flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h2 className="text-[20px] font-semibold leading-[1.22] tracking-[-0.015em] text-[#0f2c59]">
                      {tr('Governing documents', 'Mga namamahalang dokumento')}
                    </h2>
                    <span className="text-[14px] text-[#5b6b7f]">
                      {tr(
                        `Showing ${filteredLegalDocs.length} of ${LEGAL_DOCS.length}`,
                        `Ipinapakita ang ${filteredLegalDocs.length} sa ${LEGAL_DOCS.length}`
                      )}
                    </span>
                  </div>

                  {/* 6 Document Cards */}
                  <div className="mt-[16px] flex flex-col gap-[20px]">
                    {filteredLegalDocs.map((doc) => {
                      const docNum = LEGAL_DOCS.indexOf(doc) + 1;
                      const readMins = estimateReadMinutes(doc, langKey);

                      return (
                        <article
                          key={doc.id}
                          className="rounded-[18px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,44,89,0.05)] grid grid-cols-1 gap-[16px] p-[20px] md:grid-cols-[52px_minmax(0,1fr)_auto] md:gap-[24px] md:p-8"
                        >
                          <span className="grid h-[52px] w-[52px] place-items-center rounded-[14px] border border-[#1870d533] bg-[linear-gradient(135deg,#eaf2fd_0%,rgba(24,112,213,0.15)_100%)] text-[#1870d5]">
                            <FileText className="h-6 w-6" />
                          </span>

                          <div className="flex min-w-0 flex-col gap-[10px]">
                            <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[6px]">
                              <span className="inline-block rounded-[6px] border border-[#e2e8f0] bg-[#f1f5f9] px-[8px] py-[2.4px] text-[12px] font-bold leading-[1.6] text-[#5b6b7f]">
                                {tr('Doc', 'Dok.')} {docNum}
                              </span>
                              <h3 className="text-[19.2px] font-bold leading-[1.22] tracking-[-0.015em] text-[#0f2c59]">
                                {doc.title[langKey]}
                              </h3>
                              <span className="inline-block rounded-full bg-[#eaf2fd] px-[8.8px] py-[2.4px] text-[12px] font-semibold leading-[1.6] text-[#1870d5]">
                                {doc.category[langKey]}
                              </span>
                            </div>

                            <p className="text-[14.72px] leading-normal text-[#5b6b7f]">
                              {doc.summary[langKey]}
                            </p>

                            <ul className="mt-[4px] grid grid-cols-1 gap-[7.2px] rounded-[10px] border border-[#eef2f7] bg-[#f1f5f9] px-[13.6px] py-[10.4px] sm:grid-cols-2">
                              {doc.keyPoints.map((kp, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-[7.2px] text-[12.8px] leading-[1.6] text-[#1e293b]"
                                >
                                  <CheckCircle2 className="mt-1 h-[13px] w-[13px] shrink-0 text-[#1870d5]" />
                                  <span>{kp[langKey]}</span>
                                </li>
                              ))}
                            </ul>

                            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.8px] text-[#5b6b7f] mt-[2px]">
                              <span>
                                <strong>{tr('Version:', 'Bersyon:')}</strong> 1.0
                              </span>
                              <span>
                                • <strong>{tr('Last updated:', 'Huling update:')}</strong>{' '}
                                2026-10-30
                              </span>
                              <span>
                                • {readMins} {tr('min read', 'minutong basa')}
                              </span>
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-[8px] md:flex-col md:items-end">
                            <button
                              type="button"
                              onClick={() => navigateTo('legal', doc.id)}
                              className="inline-flex w-full sm:w-auto items-center justify-center gap-[7.2px] whitespace-nowrap rounded-full border border-transparent bg-[#1870d5] px-[16.8px] py-[8.8px] text-[14.88px] font-semibold leading-tight text-white shadow-[0_6px_18px_-6px_#1870d58c] transition-colors hover:bg-[#1563bb] cursor-pointer group"
                            >
                              <span>{tr('Read document', 'Basahin')}</span>
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-[2px]" />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* ======================================================================
         SHARED PUBLIC FOOTER
         ====================================================================== */}
      <footer className="relative z-10 mt-[48px] bg-white print:hidden">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#f1c40fe6] via-[#1870d5] to-[#f1c40fe6]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(900px_120px_at_50%_0%,rgba(24,112,213,0.18)_0%,transparent_100%)]"
        />

        <div
          className={`${containerClass} relative flex flex-col gap-[36px] pt-[64px] md:pt-[84px] pb-[44px]`}
        >
          {/* Top Brand Row */}
          <div className="flex flex-col sm:flex-row items-start gap-[16px] sm:gap-[20px] border-b border-[#eef2f7] pb-[32px]">
            <img
              src="/Government Service Integrity Seal.png"
              alt="GovServe Seal"
              className="h-[54px] w-[54px] shrink-0 rounded-full border-2 border-[#f1c40fb3] object-cover shadow-[0_0_24px_#f1c40f40] bg-white"
            />
            <div className="flex flex-col gap-[5.6px]">
              <div className="flex flex-wrap items-center gap-[9.6px] text-[20px] font-bold tracking-[-0.01em] text-[#0f2c59]">
                <span>GOVSERVE</span>
                <span className="rounded-full border border-[#f6e6a6] bg-[#fdf6d9] px-[8.8px] py-[2.4px] text-[11.2px] font-bold uppercase tracking-wider text-[#8a6a08]">
                  {tr('Social Services Management', 'Pamamahala sa Serbisyong Panlipunan')}
                </span>
              </div>
              <p className="max-w-[540px] text-[14px] leading-[1.6] text-[#5b6b7f]">
                {tr(
                  'Streamline AICS medical and burial assistance, PWD and Senior Citizen welfare benefits, Solo Parent and Child Welfare support, and Livelihood training all in one unified platform.',
                  'Pabilisin ang AICS medical at burial assistance, benepisyo ng PWD at Senior Citizen, suporta sa Solo Parent at Child Welfare, at Livelihood training — lahat sa iisang plataporma.'
                )}
              </p>
            </div>
          </div>

          {/* Footer Link Columns */}
          <div className="grid grid-cols-1 gap-[28px] sm:grid-cols-2 lg:grid-cols-3">
            {footerColumns.map((col) => (
              <div key={col.title} className="flex flex-col gap-[13.6px]">
                <h4 className="flex items-center gap-[8px] text-[13.1px] font-bold uppercase leading-[1.22] tracking-[0.08em] text-[#5b6b7f]">
                  <span className="text-[#1870d5]">{col.icon}</span>
                  <span>{col.title}</span>
                </h4>
                <ul className="flex flex-col gap-[8.8px]">
                  {col.links.map((lnk) => (
                    <li key={lnk.label}>
                      <button
                        type="button"
                        onClick={lnk.onClick}
                        className="group inline-flex items-center gap-[7.2px] text-left text-[14px] leading-[1.4] text-[#0f2c59] transition hover:translate-x-[3px] hover:text-[#1870d5] cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4 shrink-0 text-[#64748b] transition-colors group-hover:text-[#1870d5]" />
                        <span>{lnk.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Copyright & Back to Top */}
          <div className="flex flex-wrap items-center justify-between gap-[16px] border-t border-[#eef2f7] pt-6 text-[13.1px] text-[#5b6b7f]">
            <p>© 2026 GOVSERVE.</p>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-[6.4px] rounded-full border border-[#e2e8f0] px-[14.4px] py-[6.4px] text-[12.8px] font-semibold transition-colors hover:border-[#1870d580] hover:bg-[#eaf2fd] hover:text-[#1870d5] cursor-pointer"
            >
              <span>{tr('Back to top', 'Bumalik sa itaas')}</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

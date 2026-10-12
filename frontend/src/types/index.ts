export interface ServiceItem {
  id: string;
  title: string;
  category: 'aics' | 'pwd' | 'senior' | 'soloparent' | 'child' | 'livelihood' | 'payout';
  description: string;
  requirements: string[];
  processingTime: string;
  benefitAmount?: string;
  iconName?: string;
  badge?: string;
}

export interface ApplicationRecord {
  referenceNo: string;
  applicantName?: string;
  serviceName: string;
  category: string;
  assistanceType?: string;
  hospitalFacility?: string;
  medicalCondition?: string;
  benefitDocumentType?: string;
  dateSubmitted: string;
  status: 'Approved' | 'Under Review' | 'Pending Documents' | 'Ready for Payout' | 'Rejected' | 'Disqualified' | 'Appointment Scheduled' | 'Completed' | 'Released' | (string & {});
  amountOrType: string;
  assignedSocialWorker: string;
  disapprovalReason?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  scheduledPayoutDate?: string;
  scheduledPayoutTime?: string;
  qrCodeData?: string;
  details?: Record<string, any>;
}

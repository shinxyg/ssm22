import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

export interface UserPhotoRecord {
  id?: number;
  email?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  phoneNumber?: string;
  profilePhoto?: string | null;
}

export function getApplicantInitials(name?: string): string {
  const clean = (name || '').trim();
  if (!clean) return 'QC';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export function resolveApplicantDynamicName(app: any): string {
  if (!app) return 'Applicant';
  const det = app.details || {};
  const pInfo = det.personalInformation || {};
  const raw = app.rawDbRecord || {};

  const fromParts = [
    app.first_name || det.firstName || pInfo.firstName || raw.first_name,
    app.middle_name || det.middleName || pInfo.middleName || raw.middle_name,
    app.last_name || det.lastName || pInfo.lastName || raw.last_name,
    (app.suffix || det.suffix || pInfo.suffix || raw.suffix || '') !== 'N/A'
      ? (app.suffix || det.suffix || pInfo.suffix || raw.suffix || '')
      : ''
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (fromParts && fromParts.split(/\s+/).length >= 2) {
    return fromParts.toUpperCase();
  }

  const directName = (
    app.applicantName ||
    app.applicant_name ||
    det.applicantName ||
    raw.applicant_name ||
    fromParts ||
    'Applicant'
  )
    .toString()
    .replace(/\s+/g, ' ')
    .trim();

  return directName.toUpperCase();
}

export function matchApplicantPhoto(app: any, users: UserPhotoRecord[]): string | null {
  if (!app) return null;
  const det = app.details || {};
  const pInfo = det.personalInformation || {};
  const raw = app.rawDbRecord || {};

  // 1. Direct photo on record if present
  const directPhoto =
    app.profilePhoto ||
    app.profile_photo ||
    det.profilePhoto ||
    det.applicantPhoto ||
    raw.profile_photo;
  if (directPhoto) return directPhoto;

  const targetName = resolveApplicantDynamicName(app).toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const targetParts = targetName.split(/\s+/).filter(Boolean);
  const tFirst = targetParts[0] || '';
  const tLast = targetParts.length >= 2 ? targetParts[targetParts.length - 1] : '';

  const targetEmail = (
    app.email ||
    app.email_address ||
    det.email ||
    det.emailAddress ||
    pInfo.email ||
    raw.email_address ||
    ''
  )
    .toString()
    .trim()
    .toLowerCase();

  const targetPhone = (
    app.phone ||
    app.phone_number ||
    det.phone ||
    det.phoneNumber ||
    pInfo.phoneNumber ||
    raw.phone_number ||
    ''
  )
    .toString()
    .replace(/[^0-9]/g, '');

  // 2. Match against backend users list
  if (Array.isArray(users)) {
    for (const u of users) {
      if (!u.profilePhoto) continue;
      const uEmail = (u.email || '').trim().toLowerCase();
      const uPhone = (u.phoneNumber || '').replace(/[^0-9]/g, '');
      const uFull = (u.fullName || u.name || `${u.firstName || ''} ${u.lastName || ''}`)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '');
      const uParts = uFull.split(/\s+/).filter(Boolean);
      const uFirst = (u.firstName || uParts[0] || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const uLast = (u.lastName || (uParts.length >= 2 ? uParts[uParts.length - 1] : '') || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

      const emailMatch = Boolean(targetEmail && uEmail && targetEmail === uEmail);
      const phoneMatch = Boolean(
        targetPhone && uPhone && targetPhone.length >= 7 && uPhone.length >= 7 && targetPhone.slice(-10) === uPhone.slice(-10)
      );
      const nameMatch = Boolean(tFirst && tLast && uFirst && uLast && tFirst === uFirst && tLast === uLast);

      if (emailMatch || phoneMatch || nameMatch) {
        return u.profilePhoto;
      }
    }
  }

  // 3. Fallback check against localStorage currentUser if on same browser
  try {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      const localU = JSON.parse(saved);
      const localPhoto = localU?.profile_photo || localU?.profilePhoto;
      if (localPhoto) {
        const lEmail = (localU.email || '').trim().toLowerCase();
        const lPhone = (localU.phone_number || localU.mobileNumber || '').replace(/[^0-9]/g, '');
        const lFirst = (localU.first_name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const lLast = (localU.last_name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

        const emailMatch = Boolean(targetEmail && lEmail && targetEmail === lEmail);
        const phoneMatch = Boolean(
          targetPhone && lPhone && targetPhone.length >= 7 && lPhone.length >= 7 && targetPhone.slice(-10) === lPhone.slice(-10)
        );
        const nameMatch = Boolean(tFirst && tLast && lFirst && lLast && tFirst === lFirst && tLast === lLast);

        if (emailMatch || phoneMatch || nameMatch) {
          return localPhoto;
        }
      }
    }
  } catch {}

  return null;
}

export function useUsersProfilePhotos() {
  const [users, setUsers] = useState<UserPhotoRecord[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 8000);
    window.addEventListener('govserve_profile_updated', fetchUsers);
    window.addEventListener('storage', fetchUsers);
    return () => {
      clearInterval(interval);
      window.removeEventListener('govserve_profile_updated', fetchUsers);
      window.removeEventListener('storage', fetchUsers);
    };
  }, [fetchUsers]);

  return users;
}


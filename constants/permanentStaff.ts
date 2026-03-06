import type { PermanentStaff } from '../types';

const genericAvatarUrl = 'https://storage.googleapis.com/aiva-test-assets/generic-avatar-2.png';
const deonAvatarUrl = 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/deon-boshoff.png';

// Manager credentials — username/password auth
export const MANAGER_CREDENTIALS: Record<string, { password: string; employeeNumber: string }> = {
    'deon@afridroids.com':              { password: 'lekker1', employeeNumber: 'PW293'  },
    'dan.western@gemyndflow.com':       { password: 'lekker1', employeeNumber: 'GEM001' },
    'derek.flower@gemyndflow.com':      { password: 'lekker1', employeeNumber: 'GEM002' },
};

// Generate 50 realistic Nashua Paarl employees
const generateNashuaStaff = (): PermanentStaff[] => {
  const departments: PermanentStaff['department'][] = [
    'Management', 'Sales & Marketing', 'Technical & Development', 'Human Resources', 'Operations'
  ];
  
  const staff: PermanentStaff[] = [
    { id: 1,  name: 'Deon Boshoff', employeeNumber: 'PW293',  avatarUrl: deonAvatarUrl,   department: 'Management', onboardedDate: '2020-01-01', healthSafetyCompleted: true, satisfaction: 5, isManager: true },
    { id: 98, name: 'Dan Western',  employeeNumber: 'GEM001', avatarUrl: genericAvatarUrl, department: 'Management', onboardedDate: '2024-01-01', healthSafetyCompleted: true, satisfaction: 5, isManager: true },
    { id: 99, name: 'Derek Flower', employeeNumber: 'GEM002', avatarUrl: genericAvatarUrl, department: 'Management', onboardedDate: '2024-01-01', healthSafetyCompleted: true, satisfaction: 5, isManager: true },
    { id: 2,  name: 'Sipho Zulu',   employeeNumber: 'D456',   avatarUrl: genericAvatarUrl, department: 'Technical & Development', onboardedDate: '2021-06-15', healthSafetyCompleted: true, satisfaction: 5, isManager: true },
    { id: 3,  name: 'Pieter van Zyl', employeeNumber: 'S507', avatarUrl: genericAvatarUrl, department: 'Sales & Marketing', onboardedDate: '2022-03-10', healthSafetyCompleted: true, satisfaction: 5 },
    { id: 4,  name: 'Ayanda Nkosi', employeeNumber: 'HR101',  avatarUrl: genericAvatarUrl, department: 'Human Resources', onboardedDate: '2021-11-20', healthSafetyCompleted: true, satisfaction: 5, isManager: true },
  ];

  const names = [
    "Johan Smith", "Lerato Dlamini", "Kobus Pretorius", "Anna Jacobs", "Thabo van der Merwe",
    "Nthabiseng Smith", "Mandla Naidoo", "Jan Botha", "Maria Williams", "Emily White",
    "David Chen", "Susan Clark", "Michael Brown", "Sarah Johnson", "Hendrik Venter"
  ];

  for (let i = 5; i <= 50; i++) {
    const name = `${names[i % names.length]} ${String.fromCharCode(65 + (i % 26))}`;
    staff.push({
      id: i,
      name: name,
      employeeNumber: `NP-${1000 + i}`,
      avatarUrl: genericAvatarUrl,
      department: departments[i % departments.length],
      onboardedDate: '2023-01-01',
      healthSafetyCompleted: Math.random() > 0.1,
      satisfaction: Math.floor(Math.random() * 2) + 4
    });
  }

  return staff;
};

export const MOCK_PERMANENT_STAFF: PermanentStaff[] = generateNashuaStaff();

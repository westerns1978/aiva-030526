export type StaffStatus = 'Available' | 'Busy' | 'Away';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: StaffStatus;
}

export interface Department {
  name: string;
  members: StaffMember[];
}

export const STAFF_DIRECTORY: Department[] = [
  {
    name: 'Management',
    members: [
      { id: 'db01', name: 'Deon Boshoff', role: 'Managing Director', status: 'Busy' },
    ],
  },
  {
    name: 'Human Resources',
    members: [
      { id: 'hr01', name: 'Ayanda Nkosi', role: 'HR Generalist', status: 'Available' },
    ],
  },
  {
    name: 'Sales & Marketing',
    members: [
      { id: 'sm01', name: 'John Smith', role: 'Sales Manager', status: 'Away' },
      { id: 'sm02', name: 'Lerato Dlamini', role: 'Marketing Coordinator', status: 'Available' },
      { id: 'sm03', name: 'Pieter van Zyl', role: 'Account Executive', status: 'Available' },
    ],
  },
  {
    name: 'Technical & Development',
    members: [
      { id: 'td01', name: 'Sipho Zulu', role: 'Lead Developer', status: 'Busy' },
      { id: 'td02', name: 'Maria Williams', role: 'IT Support Specialist', status: 'Available' },
    ],
  },
  {
    name: 'Operations',
    members: [
       { id: 'op01', name: 'Kobus Pretorius', role: 'Operations Manager', status: 'Away' },
       { id: 'op02', name: 'Anna Jacobs', role: 'Logistics Coordinator', status: 'Available' },
    ]
  }
];

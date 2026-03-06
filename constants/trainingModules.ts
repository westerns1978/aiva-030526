
import type { TrainingModule } from '../types';

export const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'mission-statement',
    title: 'Nashua Paarl Mission',
    description: 'Our purpose, values, and the E.T.P.A.R framework that drives everything we do.',
    type: 'video',
    role: ['employee', 'manager', 'farm_worker'],
    isCompliance: false,
    videoUrl: 'https://storage.googleapis.com/gemynd-public/projects/aiva/021526/aiva-10-digital-transformation.mp4',
    supplementaryVideos: [
        { title: 'The 6-Step Journey', url: 'https://storage.googleapis.com/gemynd-public/projects/aiva/021526/aiva-03-six-steps.mp4' },
        { title: 'WhatsApp Handshake', url: 'https://storage.googleapis.com/gemynd-public/projects/aiva/021526/aiva-01-whatsapp-handshake.mp4' },
        { title: 'Multilingual Fluency', url: 'https://storage.googleapis.com/gemynd-public/projects/aiva/021526/aiva-05-multilingual-fluency.mp4' },
    ],
    duration: '2 min',
  },
  {
    id: 'hs01',
    title: 'Health & Safety Compliance',
    description: 'Clinical source of truth for branch safety protocols and emergency procedures.',
    type: 'quiz',
    role: ['employee', 'manager', 'trainer', 'farm_worker'],
    isCompliance: true,
    passThreshold: 0.75,
    supplementaryVideos: [
        { title: 'PPE Verification', url: 'https://storage.googleapis.com/gemynd-public/projects/aiva/021526/aiva-06-ppe-verification.mp4' },
    ],
    quizData: [
      {
        question: 'Where is the primary fire assembly point?',
        options: ['Main Entrance', 'Parking Lot B', 'Cafeteria', 'Loading Dock'],
        correctAnswer: 'Parking Lot B',
      },
      {
        question: 'What is the first step in case of an electrical fire?',
        options: ['Throw water on it', 'Use a CO2 fire extinguisher', 'Turn off the main power supply', 'Open windows for ventilation'],
        correctAnswer: 'Turn off the main power supply',
      },
      {
        question: 'Who is the designated First Aid officer on your floor?',
        options: ['Ayanda Nkosi (HR)', 'John Smith (Sales)', 'Your direct manager', 'The closest available person'],
        correctAnswer: 'Ayanda Nkosi (HR)',
      },
      {
        question: 'What number do you call for emergency services in South Africa?',
        options: ['911', '10111', '112', '999'],
        correctAnswer: '10111',
      },
      {
        question: 'How often must fire extinguishers be inspected according to SABS standards?',
        options: ['Every month', 'Every 6 months', 'Every year', 'Every 2 years'],
        correctAnswer: 'Every year',
      },
      {
        question: 'What does the acronym PASS stand for when using a fire extinguisher?',
        options: [
          'Push, Aim, Squeeze, Sweep',
          'Pull, Aim, Squeeze, Sweep',
          'Pull, Activate, Spray, Stop',
          'Push, Activate, Spray, Sweep'
        ],
        correctAnswer: 'Pull, Aim, Squeeze, Sweep',
      },
      {
        question: 'If you discover a gas leak in the warehouse, what should you do FIRST?',
        options: [
          'Turn on the ventilation system',
          'Call the fire department',
          'Evacuate the area without using electrical switches',
          'Try to locate and seal the leak'
        ],
        correctAnswer: 'Evacuate the area without using electrical switches',
      },
      {
        question: 'Under South African OHS Act, who is ultimately responsible for workplace safety?',
        options: [
          'The safety officer only',
          'Each individual employee',
          'The employer',
          'The Department of Labour'
        ],
        correctAnswer: 'The employer',
      },
    ],
  },
  {
    id: 'culture01',
    title: 'Strategic Culture & Values',
    description: 'The E.T.P.A.R values blueprint that drives Nashua Paarl excellence.',
    type: 'video',
    role: ['employee', 'manager', 'trainer', 'farm_worker'],
    isCompliance: false,
    videoUrl: 'https://storage.googleapis.com/gemynd-public/projects/aiva/021526/aiva-07-policy-intelligence.mp4',
    supplementaryVideos: [
        { title: 'ID Capture', url: 'https://storage.googleapis.com/gemynd-public/projects/aiva/021526/aiva-02-id-capture.mp4' },
        { title: 'Contract Signing', url: 'https://storage.googleapis.com/gemynd-public/projects/aiva/021526/aiva-04-contract-signing.mp4' },
        { title: 'Completion Celebration', url: 'https://storage.googleapis.com/gemynd-public/projects/aiva/021526/aiva-09-celebration.mp4' },
    ],
  },
  {
    id: 'workflow-sandbox-01',
    title: 'Workflow Sandbox',
    description: 'Practice real-world client interactions and hardware troubleshooting in a zero-risk sandbox.',
    type: 'workflow-sandbox',
    role: ['employee', 'manager'],
    isCompliance: false,
    scenarios: [
      {
        id: 'customer-dispute',
        title: 'Ricoh Service Dispute',
        description: 'Practice de-escalating a situation with a client disputing a service contract.',
        systemPrompt: 'You are a client at Nashua Paarl. You feel the service response time for your Ricoh MFP was outside of the SLA. You are firm but professional. Aiva will coach the user to use the specific SLAs from the manual.'
      },
      {
        id: 'leave-cycle-explainer',
        title: 'Explaining the Leave Cycle',
        description: 'Practice explaining the 15-day annual leave cycle and December blackout periods.',
        systemPrompt: 'You are a new hire who is confused about why they cannot take leave in the first two weeks of December. Be curious and slightly insistent.'
      }
    ]
  },
  {
    id: 'manager-overview',
    title: 'Manager Dashboard Overview',
    description: 'Your workforce pipeline at a glance — metrics, compliance, and real-time team status.',
    type: 'video',
    role: ['manager'],
    isCompliance: false,
    videoUrl: 'https://storage.googleapis.com/gemynd-public/projects/aiva/021526/aiva-08-helicopter.mp4',
    supplementaryVideos: [
        { title: 'Digital Transformation', url: 'https://storage.googleapis.com/gemynd-public/projects/aiva/021526/aiva-10-digital-transformation.mp4' },
    ],
    duration: '1 min',
  },
  {
    id: 'readiness-lab-01',
    title: 'Role-Specific Simulation',
    description: 'Master your workflow with AI-guided scenarios designed for Nashua Paarl operational readiness.',
    type: 'readiness-lab',
    role: ['employee', 'manager'],
    isCompliance: false,
    interviewScenarios: [
      {
        id: 'new-hire-greeting',
        title: 'First Day Welcome',
        description: 'Practice greeting and orienting a new team member on their first day.',
        question: 'A new hire has just arrived at reception. Walk them through their first hour.'
      },
      {
        id: 'client-escalation',
        title: 'Client Escalation',
        description: 'Handle a frustrated client whose printer SLA was missed.',
        question: 'A key account client calls saying their Ricoh MFP has been down for 48 hours past the SLA. How do you handle it?'
      },
      {
        id: 'safety-incident',
        title: 'Safety Incident Response',
        description: 'Respond to a workplace safety incident correctly.',
        question: 'A colleague has slipped in the warehouse and is holding their ankle. What are your immediate steps?'
      }
    ]
  },
  {
    id: 'policy-flashcards',
    title: 'Policy Flashcards',
    description: '71 Cards · Nashua Knowledge Registry',
    type: 'flashcards',
    role: ['employee', 'manager'],
    isCompliance: false,
  }
];

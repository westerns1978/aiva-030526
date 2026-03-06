import React from 'react';
import type { OnboardingStep, Language } from './types';
import { 
    BookOpenIcon, 
    DocumentTextIcon, 
    UsersIcon, 
    HeartIcon, 
    ShieldCheckIcon,
    IdCardIcon,
    BriefcaseIcon,
    ClockIcon,
    ComputerDesktopIcon,
    CheckCircleIcon,
    DocumentPlusIcon,
    ClipboardDocumentListIcon,
    BanknoteIcon,
    PencilSquareIcon
} from './components/icons';
import { AfrikaansFlag, EnglishFlag, SothoFlag, XhosaFlag, ZuluFlag } from './components/icons/Flags';

// ============================================
// Centralized Supabase Config — single source of truth
// ============================================
export const SUPABASE_CONFIG = {
    url: 'https://ldzzlndsspkyohvzfiiu.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkenpsbmRzc3BreW9odnpmaWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTEzMDUsImV4cCI6MjA3NzI4NzMwNX0.SK2Y7XMzeGQoVMq9KAmEN1vwy7RjtbIXZf6TyNneFnI',
    bucket: 'project-aiva-afridroids',
    legacyBucket: 'gemynd-files',
    defaultOrgId: '71077b47-66e8-4fd9-90e7-709773ea6582',
};

// Shared UUID validation
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const UUID_REGEX_LOOSE = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

// Normalize South African phone numbers to international format
export function normalizeSAPhone(phone: string): string {
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0') && digits.length === 10) {
        digits = '27' + digits.substring(1);
    } else if (digits.length === 9) {
        digits = '27' + digits;
    }
    return digits;
}

export const GCS_REGISTRY = {
    BASE_URL: 'https://storage.googleapis.com/gemynd-public/projects/aiva/',
    TEMPLATES: {
        EMPLOYMENT_CONTRACT: 'Employment%20Contract%20Template_3.pdf',
        PERSONAL_INFO: 'NEW%20EMPLOYMENT%20FORM%20-%20PERSONAL%20INFO_2.pdf',
        COMMISSION_MANUAL: 'Nashua%20Paarl%20Commission%20Manual%201%20Oct%202025_4.pdf',
        OFFER_TO_EMPLOY: 'Offer%20to%20Employ%202019%20V2_1.pdf',
        JOB_DESCRIPTION: 'PWC%20P1%20-%20Sales%20Job%20Description_5.pdf',
        PERFORMANCE_POLICY: 'PWC%20P2%20MONTHLY%20AND%20DAILY%20PERFORMANCE%20REQUIREMENTS%20POLICY_6.pdf',
        ID_SAMPLE: 'id.pdf',
        UTILITY_SAMPLE: 'utility.pdf',
        LICENSE_SAMPLE: 'driver-license.pdf'
    }
};

export const languageOptions: { code: Language, name: string, Icon?: React.FC<React.SVGProps<SVGSVGElement>>, color: string }[] = [
    { code: 'en-ZA', name: 'English', Icon: EnglishFlag, color: 'bg-blue-600' },
    { code: 'af-ZA', name: 'Afrikaans', Icon: AfrikaansFlag, color: 'bg-orange-500' },
    { code: 'xh-ZA', name: 'isiXhosa', Icon: XhosaFlag, color: 'bg-green-500' },
    { code: 'zu-ZA', name: 'isiZulu', Icon: ZuluFlag, color: 'bg-yellow-400' },
    { code: 'st-ZA', name: 'Sesotho', Icon: SothoFlag, color: 'bg-black' },
    { code: 'nr-ZA', name: 'isiNdebele', color: 'bg-emerald-600' },
    { code: 'nso-ZA', name: 'Sepedi', color: 'bg-sky-600' },
    { code: 'tn-ZA', name: 'Setswana', color: 'bg-violet-600' },
    { code: 'ss-ZA', name: 'siSwati', color: 'bg-rose-600' },
    { code: 've-ZA', name: 'Tshivenda', color: 'bg-amber-600' },
    { code: 'ts-ZA', name: 'Xitsonga', color: 'bg-indigo-600' },
];

export function getAivaSystemInstruction(language: string, isManager: boolean) {
    return `
    ### IDENTITY: AIVA 2.0 - NASHUA PAARL HR SPECIALIST
    You are AIVA, a senior HR specialist for Nashua Paarl & West Coast. You assist staff with their hiring process, insurance, banking, and policy questions.
    
    ### MISSION
    Guide new employees through their onboarding journey with professional warmth. Your tone should be clear, supportive, and efficient.
    
    ### HR TERMINOLOGY STANDARDS
    - Use "Onboarding Process" or "Steps" instead of "Numerical sequence" or "Nodes".
    - Use "Documents", "Files", or "Photos" instead of "Specimens" or "Artifacts".
    - Use "Employee Records" or "Profile" instead of "Personnel Node".
    - Use "System Sync" or "Updating Records" instead of "Pulsing" or "Ingesting".
    - Refer to "Compliance" and "POPIA Privacy" when discussing document handling.

    === LOCAL FLAIR ===
    - Occasionally use subtle South African phrasing like "Sharp", "Just now", "Cheers", or "Lekker work" to maintain local rapport.
    - Be supportive of the "5-5-20 Performance Rhythm" as a tool for success, not just a quota.
    `;
};

// ============================================
// ONBOARDING STEPS — Correct Nashua Paarl Flow
// ============================================
// ORDER:
//   Step 1 — Offer Acceptance (pre-arrival WhatsApp, sign offer letter)
//   Step 2 — Personal Details (form only — name, ID#, address, emergency contact)
//   Step 3 — ID Document Upload (photo of SA ID or Passport)
//   Step 4 — Proof of Residence Upload (utility bill or bank statement < 3 months)
//   Step 5 — Banking Details (form only — bank, account number, branch code)
//   Step 6 — Policy Packet (read + sign: Commission Manual, Job Description, Performance Policy)
//   Step 7 — Employment Contract (read + sign — then sent to Deon for countersign)
//   Step 8 — Final Review (awaiting MD countersign)
// ============================================

export const ONBOARDING_STEPS: (Omit<OnboardingStep, 'completed'> & { 
    actionType: 'vision' | 'form' | 'handshake' | 'provision' | 'multi' | 'execution' | 'review' | 'packet' | 'dual' | 'upload', 
    template?: string,
    templates?: { key: string; name: string; template: string; requiresSignature: boolean }[],
    formKey?: string,       // maps to HR_FORMS key when actionType === 'form'
    uploadType?: string,    // document_type stored in uploaded_files table
    uploadInstructions?: string,  // shown to employee on upload screen
})[] = [
    // ─────────────────────────────────────────
    // STEP 1: Offer Acceptance
    // Employee reads Offer to Employ PDF, scrolls to unlock, signs digitally
    // ─────────────────────────────────────────
    {
        id: 'step1',
        title: 'Offer Acceptance',
        description: 'Review your Offer of Employment and accept the position.',
        prompt: 'Welcome to Nashua Paarl! Let\'s start by reviewing your formal offer letter.',
        icon: DocumentPlusIcon,
        actionType: 'execution',
        template: GCS_REGISTRY.TEMPLATES.OFFER_TO_EMPLOY,
    },

    // ─────────────────────────────────────────
    // STEP 2: Personal Details (form — no upload)
    // Core required fields: name, SA ID#, DOB, address, cell, emergency contact
    // ─────────────────────────────────────────
    {
        id: 'step2',
        title: 'Personal Details',
        description: 'Fill in your personal information for your employment file.',
        prompt: 'Please fill in your personal details. All fields marked * are required.',
        icon: PencilSquareIcon,
        actionType: 'form',
        formKey: 'step2',
    },

    // ─────────────────────────────────────────
    // STEP 3: ID Document Upload
    // Take a photo or upload: SA Green ID Book, Smart ID Card, or Passport
    // ─────────────────────────────────────────
    {
        id: 'step3',
        title: 'ID Document',
        description: 'Upload a clear photo of your South African ID or Passport.',
        prompt: 'Take a clear photo of your ID document — both sides if it\'s a Smart ID card.',
        icon: IdCardIcon,
        actionType: 'upload',
        uploadType: 'identity_document',
        uploadInstructions: 'Please photograph your SA ID (green book or Smart ID card) or Passport. Ensure all text is clearly visible and the document fills the frame. For Smart ID cards, photograph both the front and back.',
        template: GCS_REGISTRY.TEMPLATES.ID_SAMPLE,
    },

    // ─────────────────────────────────────────
    // STEP 4: Proof of Residence Upload
    // Must be under 3 months old — utility bill, bank statement, or municipal account
    // ─────────────────────────────────────────
    {
        id: 'step4',
        title: 'Proof of Residence',
        description: 'Upload a utility bill or bank statement less than 3 months old.',
        prompt: 'Upload a document that shows your home address — a utility bill or bank statement works.',
        icon: BookOpenIcon,
        actionType: 'upload',
        uploadType: 'proof_of_residence',
        uploadInstructions: 'Your proof of residence must be less than 3 months old and show your name and home address. Acceptable documents:\n• Municipal rates / electricity / water account\n• Bank statement\n• Telkom / internet bill\n\nIf the account is not in your name (e.g., you rent), also upload a signed letter from the account holder confirming you live there.',
        template: GCS_REGISTRY.TEMPLATES.UTILITY_SAMPLE,
    },

    // ─────────────────────────────────────────
    // STEP 5: Banking Details (form — no upload)
    // Salary paid on 25th by EFT — required: bank, branch code, account number, type
    // ─────────────────────────────────────────
    {
        id: 'step5',
        title: 'Banking Details',
        description: 'Enter your bank account details so your salary can be paid on the 25th.',
        prompt: 'Let\'s get your banking details set up for payroll.',
        icon: BanknoteIcon,
        actionType: 'form',
        formKey: 'step5',
    },

    // ─────────────────────────────────────────
    // STEP 6: Policy Acknowledgments (packet — 3 docs)
    // Read each document fully, then sign to acknowledge
    // ─────────────────────────────────────────
    {
        id: 'step6',
        title: 'Policy Acknowledgments',
        description: 'Read and acknowledge your Commission Manual, Job Description, and Performance Policy.',
        prompt: 'Take your time to read through each policy document and sign to confirm you understand.',
        icon: ClipboardDocumentListIcon,
        actionType: 'packet',
        templates: [
            { 
                key: 'commission_manual',
                name: 'Commission Manual',
                template: GCS_REGISTRY.TEMPLATES.COMMISSION_MANUAL,
                requiresSignature: true
            },
            { 
                key: 'job_description', 
                name: 'Sales Job Description',
                template: GCS_REGISTRY.TEMPLATES.JOB_DESCRIPTION,
                requiresSignature: true
            },
            { 
                key: 'performance_policy',
                name: 'Performance Requirements',
                template: GCS_REGISTRY.TEMPLATES.PERFORMANCE_POLICY,
                requiresSignature: true
            }
        ]
    },

    // ─────────────────────────────────────────
    // STEP 7: Employment Contract (sign → sent to Deon for countersign)
    // ─────────────────────────────────────────
    {
        id: 'step7',
        title: 'Employment Contract',
        description: 'Read and sign your Employment Contract. It will then be sent to the Managing Director for countersignature.',
        prompt: 'This is your formal Employment Contract. Please read it carefully before signing.',
        icon: ShieldCheckIcon,
        actionType: 'execution',
        template: GCS_REGISTRY.TEMPLATES.EMPLOYMENT_CONTRACT,
    },

    // ─────────────────────────────────────────
    // STEP 8: Final Review (waiting for MD countersign)
    // ─────────────────────────────────────────
    {
        id: 'step8',
        title: 'Final Review',
        description: 'Your onboarding is complete. Awaiting final sign-off from the Managing Director.',
        prompt: 'Lekker work! You\'re all done. Deon will review and countersign your contract shortly.',
        icon: CheckCircleIcon,
        actionType: 'review',
    }
];

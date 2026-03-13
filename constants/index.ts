// src/constants/index.ts
// No JSX in this file — icons live in ./stepIcons.tsx

import {
    StepUserIcon,
    StepIdIcon,
    StepHomeIcon,
    StepBankIcon,
    StepPolicyIcon,
    StepGiftIcon,
    StepContractIcon,
    StepCompleteIcon,
} from './stepIcons';

// ─── GCS Document Registry ────────────────────────────────────────────────────

export const GCS_REGISTRY = {
    BASE_URL: 'https://storage.googleapis.com/gemynd-public/projects/aiva/',
    PATHS: {
        EMPLOYMENT_CONTRACT: 'Employment%20Contract%20Template_3.pdf',
        OFFER_LETTER:        'Offer%20Letter%20Template.pdf',
        COMMISSION_MANUAL:   'Commission%20Manual.pdf',
        JOB_DESCRIPTION:     'Job%20Description%20Template.pdf',
        PERFORMANCE_POLICY:  'Performance%20Policy.pdf',
        LEAVE_POLICY:        'Leave%20Policy.pdf',
        CODE_OF_CONDUCT:     'Code%20of%20Conduct.pdf',
    },
} as const;

// ─── Language Options ─────────────────────────────────────────────────────────

export interface LanguageOption {
    code:       string;
    name:       string;
    nativeName: string;
    color:      string;
}

export const languageOptions: LanguageOption[] = [
    { code: 'en-ZA',  name: 'English',    nativeName: 'English',    color: 'bg-blue-500'   },
    { code: 'af-ZA',  name: 'Afrikaans',  nativeName: 'Afrikaans',  color: 'bg-orange-500' },
    { code: 'xh-ZA',  name: 'isiXhosa',   nativeName: 'isiXhosa',   color: 'bg-green-600'  },
    { code: 'zu-ZA',  name: 'isiZulu',    nativeName: 'isiZulu',    color: 'bg-yellow-500' },
    { code: 'st-ZA',  name: 'Sesotho',    nativeName: 'Sesotho',    color: 'bg-red-500'    },
    { code: 'nr-ZA',  name: 'isiNdebele', nativeName: 'isiNdebele', color: 'bg-purple-500' },
    { code: 'ss-ZA',  name: 'siSwati',    nativeName: 'siSwati',    color: 'bg-pink-500'   },
    { code: 've-ZA',  name: 'Tshivenda',  nativeName: 'Tshivenḓa', color: 'bg-indigo-500' },
    { code: 'ts-ZA',  name: 'Xitsonga',   nativeName: 'Xitsonga',   color: 'bg-teal-500'   },
    { code: 'tn-ZA',  name: 'Setswana',   nativeName: 'Setswana',   color: 'bg-cyan-500'   },
    { code: 'nso-ZA', name: 'Sepedi',     nativeName: 'Sepedi',     color: 'bg-lime-500'   },
];

// ─── Onboarding Step Types ────────────────────────────────────────────────────

export type OnboardingActionType =
    | 'execution'
    | 'dual'
    | 'upload'
    | 'form'
    | 'packet'
    | 'review';

export interface OnboardingStepDef {
    id:                  string;
    title:               string;
    description:         string;
    prompt:              string;
    icon:                React.FC<{ className?: string }>;
    actionType:          OnboardingActionType;
    completed?:          boolean;
    template?:           string;
    templates?:          { name: string; url: string; required?: boolean }[];
    formKey?:            string;
    uploadType?:         string;
    uploadInstructions?: string;
}

// Re-export icons so other files can import from constants
export {
    StepUserIcon,
    StepIdIcon,
    StepHomeIcon,
    StepBankIcon,
    StepPolicyIcon,
    StepGiftIcon,
    StepContractIcon,
    StepCompleteIcon,
};

// ─── ONBOARDING_STEPS ─────────────────────────────────────────────────────────

export const ONBOARDING_STEPS: OnboardingStepDef[] = [
    {
        id:          'step1',
        title:       'Step 1: Employment Offer',
        description: 'Review and accept your personalised offer of employment from Nashua Paarl.',
        prompt:      'Tell me about the employment offer and what I should look for before accepting.',
        icon:        StepUserIcon,
        actionType:  'execution',
        template:    GCS_REGISTRY.PATHS.OFFER_LETTER,
    },
    {
        id:                  'step2',
        title:               'Step 2: Identity Verification',
        description:         "Upload your SA ID or passport. We'll scan and pre-fill your details automatically.",
        prompt:              'What documents do I need to verify my identity for employment?',
        icon:                StepIdIcon,
        actionType:          'dual',
        uploadType:          'identity_document',
        uploadInstructions:  'Take a clear, well-lit photo of your SA ID or Smart Card. Ensure all four corners are visible. Foreign nationals: upload passport + valid work permit.',
        formKey:             'step2',
    },
    {
        id:                  'step3',
        title:               'Step 3: Address Verification',
        description:         'Upload a utility bill, bank statement, or lease agreement dated within 3 months.',
        prompt:              'What counts as acceptable proof of address for employment in South Africa?',
        icon:                StepHomeIcon,
        actionType:          'dual',
        uploadType:          'proof_of_residence',
        uploadInstructions:  'Upload a utility bill, bank statement, or official letter dated within the last 3 months. Your name and residential address must be clearly visible. PO Box addresses are not accepted.',
        formKey:             'step3',
    },
    {
        id:          'step4',
        title:       'Step 4: Banking Details',
        description: 'Provide your bank account details for salary payments on the 25th of each month.',
        prompt:      'Why does Nashua need my banking details and how is it kept secure?',
        icon:        StepBankIcon,
        actionType:  'form',
        formKey:     'step4',
    },
    {
        id:          'step5',
        title:       'Step 5: Policy Review',
        description: 'Read and acknowledge the Nashua HR policies that apply to your employment.',
        prompt:      'Explain the most important HR policies at Nashua that I should know about.',
        icon:        StepPolicyIcon,
        actionType:  'packet',
    },
    {
        id:          'step6',
        title:       'Step 6: Benefits & Documents',
        description: 'Sign your job description, review your benefits, and complete remaining documents.',
        prompt:      'What employee benefits does Nashua offer, and what documents do I need to sign?',
        icon:        StepGiftIcon,
        actionType:  'packet',
        templates:   [
            { name: 'Job Description',   url: `${GCS_REGISTRY.BASE_URL}${GCS_REGISTRY.PATHS.JOB_DESCRIPTION}`,  required: true  },
            { name: 'Commission Manual', url: `${GCS_REGISTRY.BASE_URL}${GCS_REGISTRY.PATHS.COMMISSION_MANUAL}`, required: false },
            { name: 'Performance Policy',url: `${GCS_REGISTRY.BASE_URL}${GCS_REGISTRY.PATHS.PERFORMANCE_POLICY}`,required: true  },
        ],
    },
    {
        id:          'step7',
        title:       'Step 7: Employment Contract',
        description: 'Review and sign your formal employment contract. Your Step 1 signature will be reused.',
        prompt:      'Walk me through the employment contract — what are the key terms I should understand?',
        icon:        StepContractIcon,
        actionType:  'execution',
        template:    GCS_REGISTRY.PATHS.EMPLOYMENT_CONTRACT,
    },
    {
        id:          'step8',
        title:       'Step 8: Final Review',
        description: 'All done! Waiting for the Managing Director to countersign your contract.',
        prompt:      'What happens after I complete all my onboarding steps? What should I expect next?',
        icon:        StepCompleteIcon,
        actionType:  'review',
    },
];

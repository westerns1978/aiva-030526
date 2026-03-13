import { FormDefinition } from '../types';

// ============================================================
// constants/hrForms.ts  —  AIVA HR Forms
// Nashua Paarl & West Coast
// ============================================================
// Keys match ONBOARDING_STEPS ids:
//   step2 → Personal Details (ID verify step, mandatory)
//   step3 → Address Verification (lightweight, if DocHub scan fails)
//   step4 → Banking Details (mandatory, no skip)
// ============================================================

export const HR_FORMS: Record<string, FormDefinition> = {

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: Personal Details
    // Triggered by "Fill In Electronically" on the ID verification step.
    // Required: surname, first names, SA ID#, DOB, cell, address, emergency contact.
    // Optional: race (EEA), marital status, tax number, medical history.
    // ─────────────────────────────────────────────────────────────────────────
    step2: {
        id: 'personal_information',
        title: 'Personal Details',
        description: 'Your personal information for your employment file and payroll. Fields marked * are required.',
        sections: [
            {
                id: 'basic_info',
                title: 'Personal Information',
                fields: [
                    {
                        id: 'surname',
                        label: 'Surname',
                        type: 'text',
                        required: true,
                        placeholder: 'Last name as it appears on your ID',
                    },
                    {
                        id: 'first_names',
                        label: 'First Names',
                        type: 'text',
                        required: true,
                        placeholder: 'All first names as they appear on your ID',
                    },
                    {
                        id: 'identity_number',
                        label: 'SA Identity Number',
                        type: 'text',
                        required: true,
                        validation: 'sa_id',
                        placeholder: '13-digit ID number',
                        helpText: 'Your 13-digit South African ID number. Enter passport number if you have a work permit.',
                    },
                    {
                        id: 'date_of_birth',
                        label: 'Date of Birth',
                        type: 'date',
                        required: true,
                    },
                    {
                        id: 'residency_status',
                        label: 'Residency Status',
                        type: 'select',
                        required: true,
                        options: ['SA Citizen', 'Permanent Resident', 'Work Permit Holder'],
                    },
                    {
                        id: 'work_permit_number',
                        label: 'Work Permit Number',
                        type: 'text',
                        required: false,
                        helpText: 'Required if you hold a work permit',
                        condition: { field: 'residency_status', value: 'Work Permit Holder' },
                    },
                    {
                        id: 'race',
                        label: 'Race (Employment Equity Act)',
                        type: 'select',
                        required: false,
                        options: ['African', 'Asian', 'Coloured', 'White', 'Prefer not to say'],
                        helpText: 'Required for South African Employment Equity compliance reporting. This information is kept confidential.',
                    },
                    {
                        id: 'drivers_licence_number',
                        label: "Driver's Licence Number",
                        type: 'text',
                        required: false,
                        placeholder: 'Leave blank if not applicable',
                    },
                ],
            },
            {
                id: 'contact_details',
                title: 'Contact Details',
                fields: [
                    {
                        id: 'cell_number',
                        label: 'Cell Number',
                        type: 'tel',
                        required: true,
                        placeholder: '0XX XXX XXXX',
                        helpText: 'This number will be used for WhatsApp notifications',
                    },
                    {
                        id: 'home_telephone',
                        label: 'Home Telephone',
                        type: 'tel',
                        required: false,
                        placeholder: 'Optional',
                    },
                    {
                        id: 'email_address',
                        label: 'Email Address',
                        type: 'text',
                        required: false,
                        placeholder: 'your@email.com',
                    },
                ],
            },
            {
                id: 'residential_address',
                title: 'Residential Address',
                fields: [
                    {
                        id: 'home_address_line_1',
                        label: 'Street Address',
                        type: 'text',
                        required: true,
                        placeholder: 'Street number and name',
                    },
                    {
                        id: 'home_address_suburb',
                        label: 'Suburb',
                        type: 'text',
                        required: false,
                        placeholder: 'Suburb or area',
                    },
                    {
                        id: 'home_address_city',
                        label: 'City / Town',
                        type: 'text',
                        required: true,
                        placeholder: 'e.g. Paarl, Cape Town',
                    },
                    {
                        id: 'home_address_province',
                        label: 'Province',
                        type: 'select',
                        required: true,
                        options: ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'],
                    },
                    {
                        id: 'postal_code',
                        label: 'Postal Code',
                        type: 'text',
                        required: true,
                        placeholder: '4-digit code',
                        validation: 'postal_code',
                    },
                ],
            },
            {
                id: 'emergency_contact',
                title: 'Emergency Contact',
                fields: [
                    {
                        id: 'emergency_contact_name',
                        label: 'Emergency Contact Name',
                        type: 'text',
                        required: true,
                        placeholder: 'Full name',
                    },
                    {
                        id: 'emergency_contact_relationship',
                        label: 'Relationship',
                        type: 'select',
                        required: true,
                        options: ['Spouse / Partner', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'],
                    },
                    {
                        id: 'emergency_contact_phone',
                        label: 'Emergency Contact Phone',
                        type: 'tel',
                        required: true,
                        placeholder: '0XX XXX XXXX',
                    },
                ],
            },
            {
                id: 'tax_info',
                title: 'Tax Information',
                fields: [
                    {
                        id: 'income_tax_number',
                        label: 'Income Tax Number',
                        type: 'text',
                        required: false,
                        placeholder: "Enter \"TBC\" if you don't have it yet",
                        helpText: 'Your SARS tax reference number. Enter "TBC" if unknown — HR will assist.',
                    },
                ],
            },
            {
                id: 'declarations',
                title: 'Declarations',
                fields: [
                    {
                        id: 'sequestration_history',
                        label: 'Have you ever been sequestrated or placed under liquidation?',
                        type: 'select',
                        required: true,
                        options: ['No', 'Yes — please provide details below'],
                    },
                    {
                        id: 'sequestration_details',
                        label: 'Sequestration Details',
                        type: 'textarea',
                        required: false,
                        placeholder: 'Provide dates and details',
                        condition: { field: 'sequestration_history', value: 'Yes — please provide details below' },
                    },
                    {
                        id: 'medical_history',
                        label: 'Medical History',
                        type: 'textarea',
                        required: false,
                        placeholder: 'Brief details of any serious illness, operations, or disabilities that may affect your work. Enter "None" if not applicable.',
                        helpText: 'This information is kept strictly confidential and used only for workplace safety planning.',
                    },
                ],
            },
        ],
        signature: {
            required: true,
            label: 'I certify that all information provided above is correct and complete to the best of my knowledge.',
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: Address Verification (lightweight fallback form)
    // Used only if the employee cannot upload proof of address.
    // Address fields overlap with step2 — they will merge into metadata.
    // ─────────────────────────────────────────────────────────────────────────
    step3: {
        id: 'address_verification',
        title: 'Residential Address',
        description: 'Please confirm your residential address. You\'ll still need to upload proof of address later.',
        sections: [
            {
                id: 'residential_address',
                title: 'Residential Address',
                fields: [
                    {
                        id: 'home_address_line_1',
                        label: 'Street Address',
                        type: 'text',
                        required: true,
                        placeholder: 'Street number and name',
                    },
                    {
                        id: 'home_address_suburb',
                        label: 'Suburb',
                        type: 'text',
                        required: false,
                        placeholder: 'Suburb or area',
                    },
                    {
                        id: 'home_address_city',
                        label: 'City / Town',
                        type: 'text',
                        required: true,
                        placeholder: 'e.g. Paarl, Cape Town',
                    },
                    {
                        id: 'home_address_province',
                        label: 'Province',
                        type: 'select',
                        required: true,
                        options: ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'],
                    },
                    {
                        id: 'postal_code',
                        label: 'Postal Code',
                        type: 'text',
                        required: true,
                        placeholder: '4-digit code',
                        validation: 'postal_code',
                    },
                ],
            },
            {
                id: 'address_type',
                title: 'Address Details',
                fields: [
                    {
                        id: 'address_is_rented',
                        label: 'Accommodation Type',
                        type: 'select',
                        required: false,
                        options: ['Own Property', 'Renting', 'Family / Other'],
                    },
                    {
                        id: 'years_at_address',
                        label: 'Years at this address',
                        type: 'select',
                        required: false,
                        options: ['Less than 1 year', '1–2 years', '3–5 years', 'More than 5 years'],
                    },
                ],
            },
        ],
        signature: {
            required: false,
            label: 'I confirm that the address provided above is my current residential address.',
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: Banking Details
    // Mandatory — no skip. Salary paid on 25th by EFT.
    // Branch code helpText lists universal codes for SA major banks.
    // ─────────────────────────────────────────────────────────────────────────
    step4: {
        id: 'banking_details',
        title: 'Banking Details',
        description: 'Your salary will be paid on the 25th of each month by bank transfer. All fields are required.',
        sections: [
            {
                id: 'bank_info',
                title: 'Bank Account Information',
                fields: [
                    {
                        id: 'account_holder_name',
                        label: 'Account Holder Name',
                        type: 'text',
                        required: true,
                        helpText: 'Must exactly match the name registered with your bank',
                    },
                    {
                        id: 'bank_name',
                        label: 'Bank',
                        type: 'select',
                        required: true,
                        options: ['ABSA', 'African Bank', 'Capitec', 'FNB', 'Investec', 'Nedbank', 'Standard Bank', 'TymeBank', 'Other'],
                    },
                    {
                        id: 'branch_name',
                        label: 'Branch Name',
                        type: 'text',
                        required: true,
                        placeholder: 'e.g. Paarl, Cape Town CBD',
                    },
                    {
                        id: 'branch_code',
                        label: 'Branch Code',
                        type: 'text',
                        required: true,
                        helpText: 'Universal codes: ABSA=632005 | Capitec=470010 | FNB=250655 | Nedbank=198765 | Standard Bank=051001 | TymeBank=678910 | African Bank=430000',
                        placeholder: '6-digit branch code',
                    },
                    {
                        id: 'account_number',
                        label: 'Account Number',
                        type: 'text',
                        required: true,
                        validation: 'numeric',
                        placeholder: 'Numbers only — no spaces or dashes',
                    },
                    {
                        id: 'account_type',
                        label: 'Account Type',
                        type: 'select',
                        required: true,
                        options: ['Cheque / Current', 'Savings', 'Transmission'],
                    },
                ],
            },
        ],
        notice: 'Your banking details are kept strictly confidential and used solely for salary payment in accordance with POPIA.',
        signature: {
            required: true,
            label: 'I confirm that the banking details provided above are correct. I understand that incorrect details may delay my salary payment.',
        },
    },
};

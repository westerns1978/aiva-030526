import React from 'react';

// --- Types for Core Entities ---

export type Language = 'en-ZA' | 'af-ZA' | 'xh-ZA' | 'zu-ZA' | 'st-ZA' | 'nr-ZA' | 'nso-ZA' | 'tn-ZA' | 'ss-ZA' | 've-ZA' | 'ts-ZA';

export enum MessageRole {
    USER = 'user',
    MODEL = 'model'
}

export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    status: 'final' | 'streaming' | 'transcribing';
    attachment?: {
        url: string;
        type: string;
    };
}

export type AppView = 'home' | 'onboarding' | 'policies' | 'training' | 'directory' | 'managerHub';

export type ModalType = 'seasonalOnboarding' | 'documentHub' | 'visitorCheckIn' | 'timeAttendance' | 'aivaVision' | 'locationFinder' | 'processMap' | 'scanProgress' | 'certProgress' | 'resetConfirm' | 'rolePlay' | 'readinessLab' | 'formEngine';

// --- Onboarding & Training ---

export interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    prompt: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    completed: boolean;
}

export type TrainingModuleType = 'video' | 'quiz' | 'workflow-sandbox' | 'readiness-lab' | 'webapp' | 'flashcards';

export interface RolePlayScenario {
    id: string;
    title: string;
    description: string;
    systemPrompt: string;
}

export interface InterviewScenario {
    id: string;
    title: string;
    description: string;
    question: string;
}

export interface TrainingModule {
    id: string;
    title: string;
    description: string;
    type: TrainingModuleType;
    role: string[];
    isCompliance: boolean;
    duration?: string;
    videoUrl?: string;
    supplementaryVideos?: { title: string; url: string }[];
    quizData?: {
        question: string;
        options: string[];
        correctAnswer: string;
    }[];
    passThreshold?: number;
    scenarios?: RolePlayScenario[];
    interviewScenarios?: InterviewScenario[];
    externalUrl?: string;
}

export interface TrainingStatus {
    [moduleId: string]: {
        progress: number;
        completed: boolean;
        certified: boolean;
    };
}

// --- Forms Engine ---
export type FormFieldType = 'text' | 'number' | 'date' | 'select' | 'bank_account' | 'tel' | 'textarea';

export interface FormField {
    id: string;
    label: string;
    type: FormFieldType;
    placeholder?: string;
    required?: boolean;
    options?: (string | { label: string; value: string })[];
    validation?: string;
    helpText?: string;
    condition?: { field: string; value: any };
}

export interface FormSection {
    id: string;
    title: string;
    fields: FormField[];
}

export interface FormDefinition {
    id: string;
    title: string;
    description: string;
    sections?: FormSection[];
    fields?: FormField[]; // Backward compatibility
    notice?: string;
    signature?: {
        required: boolean;
        label: string;
    };
}

// --- Workforce & Performance ---

export interface PermanentStaff {
    id: number;
    name: string;
    employeeNumber: string;
    avatarUrl: string;
    department: 'Management' | 'Sales & Marketing' | 'Technical & Development' | 'Human Resources' | 'Operations';
    onboardedDate: string;
    healthSafetyCompleted: boolean;
    satisfaction: number;
    isManager?: boolean;
}

export interface TechPerformance {
    tech_id: string;
    name: string;
    call_completion_rate: number;
    satisfaction_score: number;
}

export interface InterviewFeedback {
    starAnalysis: string;
    clarity: string;
    strengths: string;
    improvements: string;
}

// --- Supabase Data Entities ---

export interface SupabaseUser {
    id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    role: 'TECH' | 'TECHNICIAN' | 'EXECUTIVE' | string;
    skill_level: 'SENIOR' | 'JUNIOR' | string;
    email: string;
    is_active: boolean;
    fd_agent_id: string | null;
}

export interface FdActivity {
    id?: string;
    fd_agent_id: string;
    billable_hours: number;
    description: string;
    status: string;
    start_time: string;
    end_time: string;
    created_at?: string;
}

// --- AI & Grounding ---

export interface GroundingMetadata {
    groundingChunks?: {
        web?: { uri: string; title: string; };
        maps?: { uri: string; title: string; placeAnswerSources?: { reviewSnippets?: string[] } };
    }[];
}

export interface AuditSnapshot {
    imageUrl: string;
    timestamp: string;
    ocrText?: string;
    detectedObjects?: { type: string; confidence: number; }[];
}

export interface VisualAuditSession {
    sessionId: string;
    agentName: string;
    snapshots: AuditSnapshot[];
}

// --- Hardware & Fleet ---

export interface Bridge {
    bridge_id: string;
    machine_name: string;
    last_seen: string;
    scanner_count: number;
    status: 'online' | 'offline';
    scanners: Scanner[];
}

export interface Scanner {
    id: string;
    name: string;
    manufacturer: string;
    model: string;
    bridge_id: string;
    twainSourceName: string;
    status: 'available' | 'busy' | 'offline';
    capabilities: any;
}

export interface Job {
    job_id: string;
    status: 'processing' | 'complete' | 'failed';
    page_count?: number;
    error?: string;
    passed?: boolean;
    log_file?: string;
}

export interface FunctionCall {
    id: string;
    name: string;
    args: any;
}

// --- HR Workflows ---

export interface LeaveRequest {
    tech_id: string;
    leave_type: 'annual' | 'sick' | 'family' | 'maternity' | 'study';
    start_date: string;
    end_date: string;
    reason?: string;
    half_day: boolean;
}

// --- Persistence ---

export interface UploadedFileRecord {
    id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    public_url: string;
    uploaded_at: string;
    org_id: string;
    metadata: {
        app?: string;
        source?: string;
        classification?: string;
        extracted?: any;
        dna?: {
            title: string;
            summary: string;
            tags: string[];
        };
        [key: string]: any;
    };
}

export interface ExtractedDocumentData {
    fullName?: string;
    idNumber?: string;
    dateOfBirth?: string;
    issueDate?: string;
    expiryDate?: string;
    address?: string;
    bankName?: string;
    accountNumber?: string;
    branchCode?: string;
    confidence?: number;
    error?: string;
    message?: string;
    documentType?: string;
    extractedFields?: any;
}

export interface AgentKnowledgeRecord {
    id?: string;
    title: string;
    content: string;
    org_id: string;
    source_name?: string;
    source_type?: string;
    metadata?: any;
    created_at?: string;
}

export interface OnboardingRecord {
    id: string;
    worker_id: string;
    full_name: string;
    status: 'in_progress' | 'completed' | 'pending';
    last_action_at: string;
    metadata: any;
}
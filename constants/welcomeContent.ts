import React from 'react';
import {
    BookOpenIcon,
    ShieldCheckIcon,
    BriefcaseIcon,
    UserGroupIcon,
    ChatBubbleLeftRightIcon,
    ClipboardDocumentCheckIcon,
    EyeIcon,
    GraduationCapIcon,
    MegaphoneIcon,
    IdentificationIcon,
    UserCheckIcon,
    QrCodeIcon,
    DocumentPlusIcon,
    MapIcon,
} from '../components/icons';
import type { PersonaKey } from './personas';

export interface SuggestionChip {
    title: string;
    prompt: string;
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
    action: 'startJourney' | 'switchView' | 'openModal';
    actionValue: string; // stepId for startJourney, view for switchView, modalId for openModal
}

export interface WelcomeScreenContent {
    greeting: string;
    subtitle: string;
    suggestions: SuggestionChip[];
}

export const WELCOME_CONTENT: Record<PersonaKey, WelcomeScreenContent> = {
    employee: {
        greeting: "Welcome to the Afridroids team!",
        subtitle: "I'm Aiva, your virtual assistant. I'm here to make your onboarding smooth and easy. What can I help you with today?",
        suggestions: [
             {
                title: 'Start My Induction',
                prompt: 'Start my new employee induction',
                Icon: ClipboardDocumentCheckIcon,
                action: 'startJourney',
                actionValue: 'step1'
            },
            {
                title: 'Process Document',
                prompt: '',
                Icon: DocumentPlusIcon,
                action: 'openModal',
                actionValue: 'documentHub'
            },
            {
                title: 'View Training',
                prompt: '',
                Icon: GraduationCapIcon,
                action: 'switchView',
                actionValue: 'training'
            },
            {
                title: 'Find a Branch',
                prompt: '',
                Icon: MapIcon,
                action: 'openModal',
                actionValue: 'locationFinder'
            },
        ],
    },
    farm_worker: {
        greeting: "Welcome! Sanibonani!",
        subtitle: "I'm Aiva. I am here to help you get started quickly. Please tap the button below to scan the QR code from your supervisor.",
        suggestions: [
             {
                title: 'Scan QR Code',
                prompt: '',
                Icon: QrCodeIcon,
                action: 'openModal',
                actionValue: 'seasonalOnboarding'
            },
            {
                title: 'Process Document',
                prompt: '',
                Icon: DocumentPlusIcon,
                action: 'openModal',
                actionValue: 'documentHub'
            },
            {
                title: 'Aiva Vision',
                prompt: '',
                Icon: EyeIcon,
                action: 'openModal',
                actionValue: 'aivaVision'
            },
        ],
    },
    visitor: {
        greeting: "Welcome to Afridroids!",
        subtitle: "I'm Aiva, the virtual receptionist. Please let me know how I can assist you with your visit today.",
        suggestions: [
            {
                title: 'Visitor Check-In',
                prompt: "",
                Icon: UserCheckIcon,
                action: 'openModal',
                actionValue: 'visitorCheckIn'
            },
            {
                title: 'Staff Directory',
                prompt: "",
                Icon: IdentificationIcon,
                action: 'switchView',
                actionValue: 'directory'
            },
            {
                title: 'Company Info',
                prompt: "Can you give me a brief overview of what Afridroids does?",
                Icon: BriefcaseIcon,
                action: 'startJourney',
                actionValue: ''
            },
        ],
    },
    manager: {
        greeting: "Welcome, Manager.",
        subtitle: "I'm Aiva, your strategic HR partner. I'm ready to assist with policy guidance, compliance, and team management.",
        suggestions: [
            {
                title: 'Policy & Compliance',
                prompt: 'Provide me with an overview of the key compliance areas in the HR policy, such as termination and performance management.',
                Icon: ShieldCheckIcon,
                action: 'startJourney',
                actionValue: ''
            },
            {
                title: 'Team Onboarding',
                prompt: 'What are the standard procedures for onboarding a new member of my team?',
                Icon: UserGroupIcon,
                action: 'startJourney',
                actionValue: ''
            },
            {
                title: 'Training Library',
                prompt: '',
                Icon: GraduationCapIcon,
                action: 'switchView',
                actionValue: 'training'
            },
            {
                title: 'Ask an Advanced Question',
                prompt: "I have a question about our skills development policy for managers.",
                Icon: ChatBubbleLeftRightIcon,
                action: 'startJourney',
                actionValue: ''
            }
        ],
    },
    trainer: {
        greeting: "Welcome, Trainer.",
        subtitle: "I'm Aiva, ready to assist with your training sessions. What would you like to do?",
        suggestions: [
            {
                title: 'Access Training Library',
                prompt: '',
                Icon: GraduationCapIcon,
                action: 'switchView',
                actionValue: 'training'
            },
            {
                title: 'View Announcements',
                prompt: '',
                Icon: MegaphoneIcon,
                action: 'switchView',
                actionValue: 'home' // Announcements are on home dashboard
            },
             {
                title: 'Ask About Training',
                prompt: 'I have a question about the skills development policy.',
                Icon: ChatBubbleLeftRightIcon,
                action: 'startJourney',
                actionValue: ''
            }
        ],
    },
};
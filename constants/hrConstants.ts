
import React from 'react';
import { OverviewIcon } from '../components/hr_icons/OverviewIcon';
import { BusinessIcon } from '../components/hr_icons/BusinessIcon';
import { BanknoteIcon } from '../components/hr_icons/BanknoteIcon';
import { GemIcon } from '../components/hr_icons/GemIcon';
import { CalendarOffIcon } from '../components/hr_icons/CalendarOffIcon';
import { GraduationCapIcon } from '../components/hr_icons/GraduationCapIcon';
import { TrendingUpIcon } from '../components/hr_icons/TrendingUpIcon';
import { HeartPulseIcon } from '../components/hr_icons/HeartPulseIcon';
import { UserGroupIcon } from '../components/icons';
import { RAG_KNOWLEDGE_BASE } from './ragKnowledgeBase';

export type HrSectionId = 'home' | 'employment' | 'roles' | 'remuneration' | 'benefits' | 'leave' | 'development' | 'performance' | 'wellness';

export const HR_POLICY_SECTIONS: { id: HrSectionId; title: string; icon: React.FC<{className?: string}> }[] = [
    { id: 'home', title: 'Home', icon: OverviewIcon },
    { id: 'employment', title: 'Employment', icon: BusinessIcon },
    { id: 'roles', title: 'Career & Roles', icon: UserGroupIcon },
    { id: 'remuneration', title: 'Remuneration', icon: BanknoteIcon },
    { id: 'benefits', title: 'Employee Benefits', icon: GemIcon },
    { id: 'leave', title: 'Leave Policies', icon: CalendarOffIcon },
    { id: 'development', title: 'Skills Development', icon: GraduationCapIcon },
    { id: 'performance', title: 'Performance', icon: TrendingUpIcon },
    { id: 'wellness', title: 'Employee Wellness', icon: HeartPulseIcon },
];

export const FULL_POLICY_TEXT = RAG_KNOWLEDGE_BASE;

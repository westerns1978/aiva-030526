export interface TeamMember {
    id: string;
    name: string;
    title: string;
    tenure: string;
    imageUrl: string;
    videoUrl: string;
    fastFacts: string[];
}

const deonAvatarUrl = 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/deon-boshoff.png';
const aivaVideoUrl = 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/aiva.mp4';

export const LEADERSHIP_TEAM: TeamMember[] = [
    {
        id: 'ceo',
        name: 'Deon Boshoff',
        title: 'CEO & Founder',
        tenure: '30+ Years Industry Experience',
        imageUrl: deonAvatarUrl,
        videoUrl: 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/deon-boshoff.mp4',
        fastFacts: [
            "Visionary behind Afridroids & the twAIn standard.",
            "30+ years of leadership at Nashua.",
            "Passionate about empowering the African workplace with AI."
        ]
    },
    {
        id: 'cio',
        name: 'Sipho Zulu',
        title: 'Chief Information Officer',
        tenure: '15+ Years in Tech',
        imageUrl: 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/sipho.png',
        videoUrl: 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/sipho.mp4',
        fastFacts: [
            "Expert in cloud infrastructure and data solutions.",
            "Leads our digital transformation initiatives.",
            "Champion of our Top ICT Employer 2024 award."
        ]
    },
    {
        id: 'hr',
        name: 'Ayanda Nkosi',
        title: 'Director of HR',
        tenure: '20 Years in Human Resources',
        imageUrl: 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/ayinda.png',
        videoUrl: 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/ayinda.mp4',
        fastFacts: [
            "Specializes in talent development and employee wellness.",
            "Drives our people-first culture.",
            "Mentors emerging leaders within the company."
        ]
    },
    {
        id: 'connectivity',
        name: 'Pieter van Zyl',
        title: 'Head of Connectivity',
        tenure: '18 Years with Nashua',
        imageUrl: 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/pietyr.png',
        videoUrl: 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/pietyr.mp4',
        fastFacts: [
            "Leads our Fibre, Wireless, and VoIP divisions.",
            "Architect of our carrier-neutral network strategy.",
            "Ensures 99.9% uptime for our clients."
        ]
    },
    {
        id: 'print',
        name: 'Lerato Dlamini',
        title: 'Director of Print & Document Services',
        tenure: '12 Years with Nashua',
        imageUrl: 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/leratro.png',
        videoUrl: 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/leratro.mp4',
        fastFacts: [
            "Key player in securing our HP Partner of the Year 2023 award.",
            "Expert in managed print solutions and document workflow.",
            "Drives sustainability in our print offerings."
        ]
    },
    {
        id: 'energy',
        name: 'Maria Williams',
        title: 'VP of Energy & Security',
        tenure: '10 Years in Solutions',
        imageUrl: 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/maria.png',
        videoUrl: 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/maria-williams.mp4',
        fastFacts: [
            "Oversees Solar, UPS, and CCTV solutions.",
            "Certified expert in renewable energy systems.",
            "Focuses on creating resilient workspaces for our clients."
        ]
    },
];

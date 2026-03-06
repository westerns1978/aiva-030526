

export const USER_PERSONAS = {
    employee: {
        name: "Employee", 
        complexity_level: "moderate",
        priority_topics: ["career_development", "performance_reviews", "technology_access", "benefits_optimization"],
        voice_speed: "normal"
    },
    farm_worker: {
        name: "Seasonal Worker",
        complexity_level: "simple",
        priority_topics: ["onboarding_fast_track", "safety_training", "daily_schedule"],
        voice_speed: "slower",
        greeting: "Welcome! Sanibonani! Goeie dag! I'm Aiva. I am here to help you get started quickly."
    },
    visitor: {
        name: "Visitor",
        complexity_level: "simple",
        priority_topics: ["directions", "host_notification", "visitor_policy"],
        voice_speed: "normal",
        greeting: "Welcome to Afridroids! I'm Aiva. I can help sign you in and notify your host. Who are you here to see today?"
    },
    manager: {
        name: "Manager",
        complexity_level: "advanced", 
        priority_topics: ["team_management", "policy_interpretation", "compliance", "strategic_planning"],
        voice_speed: "normal",
        show_advanced_features: true
    },
    trainer: {
        name: "Trainer",
        complexity_level: "moderate",
        priority_topics: ["training_modules", "compliance_tracking", "team_progress"],
        voice_speed: "normal",
        greeting: "Welcome, Trainer. I'm Aiva, ready to assist with training sessions and compliance tracking."
    },
} as const;

export type PersonaKey = keyof typeof USER_PERSONAS;
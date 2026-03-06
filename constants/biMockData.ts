
export const BI_MOCK_DATA = {
  profiles: {
    deon: {
      id: "emp_01",
      name: "Deon Boshoff",
      role: "Managing Director / Owner",
      permissions: ["FULL_ACCESS", "ROI_COMMAND", "STRATEGIC_telemetry"],
      focus: "Strategic Expansion & HR ROI"
    },
    ayanda: {
      id: "emp_20",
      name: "Ayanda Nkosi",
      role: "HR Manager",
      permissions: ["WORKFORCE_MGMT", "ONBOARDING_telemetry", "POLICY_INGESTION"],
      focus: "Clinical Compliance & Onboarding"
    }
  },
  company: {
    name: "Nashua Paarl & West Coast",
    location: "Paarl, Western Cape, South Africa",
    industry: "Office automation, IT services, connectivity, security",
    headcount: 50,
    revenue_split: {
      print: 0.40,
      connectivity_it: 0.30,
      security_solar: 0.20,
      other: 0.10
    }
  },
  onboarding_metrics: {
    aiva_duration_days_avg: 3.2,
    manual_duration_days_avg: 9.1,
    time_reduction_percent: 64.8,
    error_rate_aiva: 0.04,
    error_rate_manual: 0.28,
    manager_minutes_per_hire_aiva: 45,
    manager_minutes_per_hire_manual: 180
  },
  compliance_metrics: {
    popia_risk_score: 14,
    shadow_it_incidents_pre_aiva: 15,
    shadow_it_incidents_current: 2,
    policy_acknowledgements_q3: 48,
    audit_completeness: 0.98
  },
  business_outcomes: {
    admin_hours_saved_monthly: 112.5,
    cost_savings_zar_annual: 345000,
    retention_improvement_percent: 72,
    onboarding_cost_zar_pre: 12000,
    onboarding_cost_zar_post: 3800
  },
  prescriptive_insights: [
    {
      id: 'ins-01',
      type: 'opportunity',
      title: 'Induction Speed Gain',
      description: 'The "Residency Verification" step is trending 40% faster this month. Suggest making "Proof of Bank" the default Step 4 to capitalize on momentum.',
      actionLabel: 'Adjust Workflow Order',
      impactScore: 85
    },
    {
      id: 'ins-02',
      type: 'risk',
      title: 'Compliance Gap: Contract S6',
      description: 'Audit shows 12% of staff in the West Coast branch have pending PWC P2 acknowledgements. Aiva nudge recommended.',
      actionLabel: 'Dispatch Nudges',
      impactScore: 92
    },
    {
        id: 'ins-04',
        type: 'risk',
        title: 'Friction: Step 4 Stalled',
        description: 'Candidate "Kobus D." has been at Step 4 (Bank Confirmation) for > 24hrs. Remind via WhatsApp API?',
        actionLabel: 'Pulse Reminder',
        impactScore: 78
    }
  ],
  workforce: {
    sentiment_vibe: 78,
    burnout_risk_score: 12,
    turnover_rate_annual: 8.4
  },
  attendance: {
    onTimeRate: 94.2
  },
  engagement: {
    response_rate: 0.89
  }
};

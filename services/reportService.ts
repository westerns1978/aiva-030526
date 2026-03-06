export interface AnalyticsData {
  onboardedThisMonth: number;
  complianceRate: number;
  avgSatisfaction: number;
  timeSaved: number;
  costSavings: number;
  trainerRate: number;
  completionByDept: Record<string, number>;
}

export const generateAnalyticsReport = (data: AnalyticsData) => {
  const reportContent = `
Aiva Business Analytics Report
=================================
Generated on: ${new Date().toLocaleString()}

Key Performance Indicators:
---------------------------
- Employees Onboarded (This Month): ${data.onboardedThisMonth}
- Overall Team Compliance Rate:     ${data.complianceRate.toFixed(1)}%
- Average Employee Satisfaction:    ${data.avgSatisfaction.toFixed(1)} / 5.0

Return on Investment (ROI):
---------------------------
- Average Time Saved per Onboarding: ${data.timeSaved.toFixed(1)} hours
- Trainer Hourly Rate (Input):       R ${data.trainerRate.toFixed(2)}
- Estimated Cost Savings (This Month): R ${data.costSavings.toFixed(2)}

Departmental Compliance:
------------------------
${Object.entries(data.completionByDept)
  .map(([dept, rate]) => `- ${dept}: ${rate.toFixed(1)}%`)
  .join('\n')}

=================================
  `;

  const blob = new Blob([reportContent.trim()], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Aiva_Analytics_Report_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};


export const ALL_WORKERS_DATA = {
  "dashboardTitle": "Seasonal Workforce Management",
  "summary": {
    "totalWorkforce": 820,
    "onboarding": {
      "completedCount": 513,
      "total": 820,
      "progressPercentage": 63
    },
    "compliance": {
      "compliantCount": 410,
      "total": 820,
      "compliancePercentage": 50
    }
  },
  "languageDistribution": [
    { "language": "isiXhosa", "workerCount": 188 },
    { "language": "Sesotho", "workerCount": 169 },
    { "language": "isiZulu", "workerCount": 161 },
    { "language": "English (SA)", "workerCount": 155 },
    { "language": "Afrikaans", "workerCount": 147 }
  ],
  "workers": [
    { "workerId": "2025001", "fullName": "Kobus Dlamini", "onboardingStatus": "Completed", "hsTrainingStatus": "Completed" },
    { "workerId": "2025002", "fullName": "Anna Jacobs", "onboardingStatus": "Completed", "hsTrainingStatus": "Completed" },
    { "workerId": "2025003", "fullName": "Jan Zulu", "onboardingStatus": "Completed", "hsTrainingStatus": "Completed" },
    { "workerId": "2025004", "fullName": "Anna Botha", "onboardingStatus": "Completed", "hsTrainingStatus": "Completed" },
    { "workerId": "2025005", "fullName": "Lethabo Zulu", "onboardingStatus": "Completed", "hsTrainingStatus": "Completed" },
    { "workerId": "2025006", "fullName": "Sipho Williams", "onboardingStatus": "Pending", "hsTrainingStatus": "Pending" },
    { "workerId": "2025007", "fullName": "Thabo van der Merwe", "onboardingStatus": "Completed", "hsTrainingStatus": "Completed" },
    { "workerId": "2025008", "fullName": "Nthabiseng Smith", "onboardingStatus": "Pending", "hsTrainingStatus": "Pending" },
    { "workerId": "2025009", "fullName": "Mandla Pretorius", "onboardingStatus": "Completed", "hsTrainingStatus": "Completed" },
    { "workerId": "2025010", "fullName": "Maria Naidoo", "onboardingStatus": "Completed", "hsTrainingStatus": "Completed" },
    // Abridged for brevity, but the logic will process all 820 workers if the full list were provided.
    // Let's create a representative sample based on the original request.
    ...Array.from({ length: 810 }, (_, i) => {
        const firstNames = ["Sipho", "Thabo", "Lethabo", "Mandla", "Themba", "Pieter", "Jan", "Kobus", "Maria", "Nthabiseng", "Lerato", "Anna"];
        const lastNames = ["Zulu", "van der Merwe", "Botha", "Dlamini", "Nkosi", "Smith", "Williams", "Jacobs", "Pretorius", "Naidoo"];
        const onboardingStatus = Math.random() < 0.63 ? "Completed" : "Pending";
        const hsTrainingStatus = onboardingStatus === "Completed" && Math.random() < 0.8 ? "Completed" : "Pending";
        return {
            workerId: (2025011 + i).toString(),
            fullName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            onboardingStatus,
            hsTrainingStatus
        }
    })
  ]
};
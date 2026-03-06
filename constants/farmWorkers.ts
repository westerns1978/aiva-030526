
import { type Language } from "../types";
import { ALL_WORKERS_DATA } from './seasonalWorkerDirectory';

export interface FarmWorker {
  id: number;
  name: string;
  language: Language;
  onboardingCompleted: boolean;
  healthSafetyCompleted: boolean;
  supervisor: string;
}


// Process the raw data from the new source of truth
const processWorkerData = (): FarmWorker[] => {
    const supervisors = ["Mr. Khumalo", "Mrs. van Zyl", "Mr. Botha", "Ms. Dlamini"];
    
    // Create a weighted language array based on distribution for realistic random assignment
    const languagePool: Language[] = [];
    const langMap: Record<string, Language> = {
        'isiXhosa': 'xh-ZA',
        'Sesotho': 'st-ZA',
        'isiZulu': 'zu-ZA',
        'English (SA)': 'en-ZA',
        'Afrikaans': 'af-ZA',
    };
    ALL_WORKERS_DATA.languageDistribution.forEach(dist => {
        const langCode = langMap[dist.language];
        if (langCode) {
            for (let i = 0; i < dist.workerCount; i++) {
                languagePool.push(langCode);
            }
        }
    });

    return ALL_WORKERS_DATA.workers.map(worker => {
        return {
            id: parseInt(worker.workerId, 10),
            name: worker.fullName,
            // Assign a random language from the weighted pool
            language: languagePool[Math.floor(Math.random() * languagePool.length)],
            onboardingCompleted: worker.onboardingStatus === "Completed",
            healthSafetyCompleted: worker.hsTrainingStatus === "Completed",
            supervisor: supervisors[Math.floor(Math.random() * supervisors.length)],
        }
    });
};

export const MOCK_FARM_WORKERS: FarmWorker[] = processWorkerData();

import { RAG_KNOWLEDGE_BASE } from '../constants/ragKnowledgeBase';
import { storageService } from './storageService';

/**
 * Searches the deterministic logic hub.
 */
export const searchAfridroidsKnowledgeBase = async (query: string): Promise<string> => {
    // Check for explicit Index requests first for protocol speed
    const indexMatch = query.match(/Index\s*(\d)/i);
    if (indexMatch) {
        const index = indexMatch[1];
        const sections = RAG_KNOWLEDGE_BASE.split('## ');
        const matched = sections.find(s => s.startsWith(`[INDEX ${index}]`));
        if (matched) return `[Blueprint Index ${index}]:\n${matched}`;
    }

    // Dynamic Brain from Supabase
    const dynamicKnowledge = await storageService.getAgentKnowledge();
    
    // Prepare pool
    const staticSections = RAG_KNOWLEDGE_BASE.split('## ').slice(1).map(s => ({
        title: s.substring(0, s.indexOf('\n')).trim(),
        content: s.substring(s.indexOf('\n') + 1)
    }));

    const dynamicSections = dynamicKnowledge.map(k => ({
        title: k.title,
        content: k.content
    }));

    const fullPool = [...staticSections, ...dynamicSections];

    // Semantic keyword match
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let bestMatch = { score: 0, content: "I couldn't find specific information on that topic in the hub." };

    fullPool.forEach(section => {
        let score = 0;
        const text = (section.title + " " + section.content).toLowerCase();
        queryWords.forEach(word => {
            if (text.includes(word)) score++;
        });
        if (score > bestMatch.score) {
            bestMatch = { score, content: `Source [${section.title}]:\n${section.content}` };
        }
    });
    
    return bestMatch.content;
};

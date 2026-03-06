import React, { useState } from 'react';
import { RAG_KNOWLEDGE_BASE } from '../constants/ragKnowledgeBase';
import { searchAfridroidsKnowledgeBase } from '../services/ragService';
import { BookOpenIcon, CheckCircleIcon, LifebuoyIcon } from './icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const DevTestTools: React.FC = () => {
    const [query, setQuery] = useState('');
    const [searchResult, setSearchResult] = useState('');
    const [isTesting, setIsTesting] = useState(false);

    const handleTestSearch = async () => {
        setIsTesting(true);
        // --- FIX: Awaited the search result as searchAfridroidsKnowledgeBase is an async function returning a Promise ---
        const result = await searchAfridroidsKnowledgeBase(query);
        setSearchResult(result);
        setIsTesting(false);
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-brand-dark dark:text-white">Developer & Test Tools</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* RAG Knowledge Base Viewer */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <BookOpenIcon className="w-6 h-6 text-brand-primary" />
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Aiva's Knowledge Base (RAG Source)</h4>
                    </div>
                    <div className="h-96 overflow-y-auto copilot-scrollbar p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <pre className="text-xs whitespace-pre-wrap text-slate-600 dark:text-slate-300">{RAG_KNOWLEDGE_BASE}</pre>
                    </div>
                </div>

                {/* RAG Test Tool */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                     <div className="flex items-center gap-3 mb-4">
                        <LifebuoyIcon className="w-6 h-6 text-brand-primary" />
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Test RAG Search Function</h4>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Enter a query to test the `search_afridroids_knowledge_base` tool and see what context the AI receives.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="e.g., 'probation period'"
                            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                        />
                        <button onClick={handleTestSearch} disabled={isTesting} className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-400">
                            Test
                        </button>
                    </div>
                    {searchResult && (
                         <div className="mt-4">
                            <h5 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">Search Result Context</h5>
                             <div className="h-64 overflow-y-auto copilot-scrollbar p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{searchResult}</ReactMarkdown>
                                </div>
                            </div>
                         </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Available Function Calls</h4>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    The following functions are available for the AI to call to interact with the app or retrieve information.
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <li><code className="bg-slate-100 dark:bg-slate-700 p-1 rounded font-mono text-xs">search_afridroids_knowledge_base(query)</code>: Searches the internal documentation for policy information.</li>
                    <li><code className="bg-slate-100 dark:bg-slate-700 p-1 rounded font-mono text-xs">get_business_intelligence_context()</code>: Retrieves the full BI report for analysis.</li>
                    <li><code className="bg-slate-100 dark:bg-slate-700 p-1 rounded font-mono text-xs">navigate_to_view(view)</code>: Changes the main screen in the app.</li>
                    <li><code className="bg-slate-100 dark:bg-slate-700 p-1 rounded font-mono text-xs">open_modal(modal_name)</code>: Opens a tool like the Document Hub or Visitor Check-in.</li>
                    <li><code className="bg-slate-100 dark:bg-slate-700 p-1 rounded font-mono text-xs">check_connection_status()</code>: Checks the MCP Orchestrator connection.</li>
                    <li><code className="bg-slate-100 dark:bg-slate-700 p-1 rounded font-mono text-xs">updateAttendanceStatus(status)</code>: Used by the Time & Attendance kiosk.</li>
                </ul>
            </div>
        </div>
    );
};
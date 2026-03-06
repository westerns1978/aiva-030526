import React, { useState, useEffect } from 'react';
import { CloseIcon, MapPinIcon, RefreshIcon } from './icons';
import { generateGroundedContent } from '../services/geminiService';
import { useAppContext } from '../context/AppContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GroundingMetadata } from '../types';

interface LocationFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationFinderModal: React.FC<LocationFinderModalProps> = ({ isOpen, onClose }) => {
    const { addToast } = useAppContext();
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [resultText, setResultText] = useState<string | null>(null);
    const [groundingMetadata, setGroundingMetadata] = useState<GroundingMetadata | null>(null);

    const getLocation = () => {
        setLocationError(null);
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            () => {
                setLocationError("Unable to retrieve your location. Please enable location services.");
            }
        );
    };

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResultText(null);
            setGroundingMetadata(null);
            setError(null);
            getLocation();
        }
    }, [isOpen]);

    const handleSearch = async (searchQuery: string) => {
        if (!location) {
            addToast("Location not available. Please allow location access.", "error");
            return;
        }
        if (!searchQuery.trim()) {
            addToast("Please enter a search query.", "info");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResultText(null);
        setGroundingMetadata(null);

        try {
            const response = await generateGroundedContent(searchQuery, location);
            setResultText(response.text || null);
            const metadata = response.candidates?.[0]?.groundingMetadata as GroundingMetadata;
            if(metadata?.groundingChunks) {
                setGroundingMetadata(metadata);
            }
        } catch (err) {
            console.error("Maps Grounding Error:", err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Failed to get results: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(query);
    }
    
    const handleSuggestionClick = (suggestion: string) => {
        setQuery(suggestion);
        handleSearch(suggestion);
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl h-[85vh] max-h-[800px] flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <MapPinIcon className="w-6 h-6 text-brand-primary"/>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Aiva Maps</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask about nearby places..."
                            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                        />
                        <button type="submit" disabled={isLoading || !location} className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-400">
                            Search
                        </button>
                    </form>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                        {['Coffee shops', 'Restaurants', 'ATMs'].map(suggestion => (
                             <button 
                                key={suggestion}
                                onClick={() => handleSuggestionClick(`${suggestion} near me`)}
                                className="px-3 py-1 text-xs font-medium text-brand-secondary bg-brand-secondary/10 rounded-full hover:bg-brand-secondary/20"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>

                    {locationError && (
                        <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-lg">
                            <p>{locationError}</p>
                            <button onClick={getLocation} className="mt-2 font-semibold underline">Try Again</button>
                        </div>
                    )}

                    {isLoading && (
                        <div className="text-center py-10">
                            <div className="w-12 h-12 border-4 border-dashed border-brand-secondary rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 text-slate-500">Searching nearby...</p>
                        </div>
                    )}
                    
                    {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

                    {resultText && (
                        <div className="prose prose-slate dark:prose-invert max-w-none prose-chat animate-fadeIn">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{resultText}</ReactMarkdown>
                        </div>
                    )}

                    {groundingMetadata?.groundingChunks && (
                         <div className="mt-6">
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Related Locations</h3>
                            <div className="space-y-2">
                                {groundingMetadata.groundingChunks.filter(c => c.maps).map((chunk, index) => (
                                    <a
                                        key={index}
                                        href={chunk.maps!.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <p className="font-semibold text-brand-secondary">{chunk.maps!.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{chunk.maps!.uri}</p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </main>

                <footer className="p-2 border-t border-slate-200 dark:border-slate-700 text-right">
                    <button onClick={getLocation} disabled={!navigator.geolocation} className="p-2 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700" title="Refresh Location">
                       <RefreshIcon className="w-4 h-4" />
                    </button>
                </footer>
            </div>
        </div>
    );
};
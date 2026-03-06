import { useState, useCallback } from 'react';
import { westflow } from '../services/westflowClient';

type AgentType = 'AIVA' | 'KATIE' | 'FLOWVIEW' | 'KPAX' | 'STORY_SCRIBE' | 'SLACK' | 'CRICKET' | 'FLOWHUB' | 'DIAGNOSTICS';

interface CallResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  agent?: string;
  [key: string]: any;
}

export function useWestFlow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generic orchestrator call with loading/error state management
   */
  const call = useCallback(async <T = any>(
    agent: AgentType,
    tool: string,
    params: Record<string, any> = {}
  ): Promise<CallResult<T> | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await westflow.call(agent, tool, params);
      
      if (!result.success) {
        setError(result.error || 'Operation failed');
      }
      
      return result as CallResult<T>;
    } catch (err: any) {
      const message = err.message || 'Connection failed';
      setError(message);
      console.error(`[useWestFlow] ${agent}/${tool} failed:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear any existing error state
   */
  const clearError = useCallback(() => setError(null), []);

  // Expose both the hook state AND the raw client for convenience methods
  return { 
    call,
    westflow,  // Access to typed convenience methods like westflow.nudgeHire()
    loading, 
    error,
    clearError
  };
}

/**
 * Agent-specific hook for cleaner component code
 */
export function useAgent(agent: AgentType) {
  // Added westflow to destructuring to provide access to convenience methods
  const { call, westflow, loading, error, clearError } = useWestFlow();

  const callTool = useCallback(
    <T = any>(tool: string, params: Record<string, any> = {}) => call<T>(agent, tool, params),
    [agent, call]
  );

  // Fix: Included westflow in the returned object to resolve property error in OnboardingPipeline.tsx
  return { callTool, westflow, loading, error, clearError };
}

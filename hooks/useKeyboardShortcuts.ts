
import { useEffect } from 'react';

export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      // Check for Ctrl/Cmd + key combinations
      const key = e.ctrlKey || e.metaKey ? `ctrl+${e.key.toLowerCase()}` : e.key;
      
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts]);
}

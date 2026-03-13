// ============================================================
// hooks/useDeviceType.ts
// Drop into: src/hooks/useDeviceType.ts
//
// Returns isMobile: true on touch devices (phones/tablets).
// Used in UploadStepPanel to show "Take Photo" on mobile only
// and "Upload File" on desktop only.
// ============================================================

import { useState, useEffect } from 'react';

export function useDeviceType() {
    const [isMobile, setIsMobile] = useState<boolean>(() => {
        // SSR-safe initial check
        if (typeof navigator === 'undefined') return false;
        return navigator.maxTouchPoints > 0 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    });

    useEffect(() => {
        // Re-check on resize (e.g. DevTools responsive toggle)
        const check = () => {
            setIsMobile(
                navigator.maxTouchPoints > 0 ||
                /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
            );
        };
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    return { isMobile, isDesktop: !isMobile };
}

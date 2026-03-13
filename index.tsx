import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// ── Back Button Protection ────────────────────────────────────────────────────
// On Android, the hardware back button fires a popstate event which closes the
// PWA / browser tab. Push a history entry on load so the first back press just
// returns to this entry rather than closing the app.
// Second back press in quick succession (within 2s) exits as normal.
(function installBackGuard() {
    // Push a sentinel entry so we always have somewhere to "go back to"
    window.history.pushState({ aiva: true }, '', window.location.href);

    let backPressedOnce = false;
    let backTimer: ReturnType<typeof setTimeout> | null = null;

    window.addEventListener('popstate', (e) => {
        // Re-push so we stay on the same URL
        window.history.pushState({ aiva: true }, '', window.location.href);

        if (backPressedOnce) {
            // Second press within 2s — allow exit by not re-pushing
            if (backTimer) clearTimeout(backTimer);
            backPressedOnce = false;
            // Dispatch a custom event so the app can show a confirmation if desired
            window.dispatchEvent(new CustomEvent('aiva-back-exit'));
            return;
        }

        backPressedOnce = true;
        // Show a brief toast/snackbar — dispatch event for the app to handle
        window.dispatchEvent(new CustomEvent('aiva-back-press'));

        backTimer = setTimeout(() => {
            backPressedOnce = false;
        }, 2000);
    });
})();

// ── Service Worker (PWA) ──────────────────────────────────────────────────────
// Only register if service-worker.js actually exists — 404 causes console noise
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Check if SW file exists before registering to suppress 404 errors
        fetch('/service-worker.js', { method: 'HEAD' })
            .then(r => {
                if (r.ok) {
                    return navigator.serviceWorker.register('/service-worker.js');
                }
                // SW file missing — skip silently
                return null;
            })
            .then(registration => {
                if (registration) console.log('Aiva SW registered:', registration.scope);
            })
            .catch(() => {
                // SW registration failed — non-critical, app works without it
            });
    });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

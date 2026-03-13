// src/hooks/usePersistentSession.ts
//
// localStorage-backed session — survives Android back button, tab close, PWA relaunch.
// Drop-in replacement for the old sessionStorage version.
// Maintains same interface: isAuthenticated, user, login, logout, saveView, getSavedView.

import { useState, useCallback, useEffect } from 'react';

const SESSION_KEY  = 'aiva-session-v2';
const VIEW_KEY     = 'aiva-saved-view';
const SESSION_TTL  = 8 * 60 * 60 * 1000; // 8 hours

export interface SessionUser {
    id?:            string;
    name:           string;
    employeeNumber?: string;
    role:           string;
    persona:        string;
    hireId?:        string;
    phone?:         string;
    loggedInAt:     string;
    lastActiveAt:   string;
}

interface StoredSession {
    user:      SessionUser;
    expiresAt: number;
}

function readSession(): SessionUser | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const stored: StoredSession = JSON.parse(raw);
        if (Date.now() > stored.expiresAt) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }
        return stored.user;
    } catch {
        return null;
    }
}

function writeSession(user: SessionUser): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
        user,
        expiresAt: Date.now() + SESSION_TTL,
    }));
}

export function usePersistentSession() {
    const [user, setUser] = useState<SessionUser | null>(() => readSession());

    const isAuthenticated = user !== null;

    // Refresh lastActiveAt every 5 minutes to keep session alive
    useEffect(() => {
        if (!user) return;
        const id = setInterval(() => {
            const current = readSession();
            if (current) writeSession({ ...current, lastActiveAt: new Date().toISOString() });
        }, 5 * 60 * 1000);
        return () => clearInterval(id);
    }, [user]);

    const login = useCallback((userData: Omit<SessionUser, 'loggedInAt' | 'lastActiveAt'>) => {
        const now = new Date().toISOString();
        const sessionUser: SessionUser = { ...userData, loggedInAt: now, lastActiveAt: now };
        writeSession(sessionUser);
        setUser(sessionUser);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(VIEW_KEY);
        setUser(null);
    }, []);

    const updateUser = useCallback((updates: Partial<SessionUser>) => {
        setUser(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...updates, lastActiveAt: new Date().toISOString() };
            writeSession(updated);
            return updated;
        });
    }, []);

    const saveView = useCallback((view: string) => {
        localStorage.setItem(VIEW_KEY, view);
    }, []);

    const getSavedView = useCallback((): string | null => {
        return localStorage.getItem(VIEW_KEY);
    }, []);

    return { isAuthenticated, user, login, logout, updateUser, saveView, getSavedView };
}

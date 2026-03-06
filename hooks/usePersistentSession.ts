import { useState, useCallback } from 'react';

const SESSION_KEY = 'aiva_session';
const VIEW_KEY = 'aiva_active_view';

interface SessionUser {
    name: string;
    role: string;
    persona: 'manager' | 'employee';
}

export const usePersistentSession = () => {
    const [user, setUser] = useState<SessionUser | null>(() => {
        if (typeof window === 'undefined') return null;
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (!saved) return null;
        try {
            return JSON.parse(saved) as SessionUser;
        } catch {
            return null;
        }
    });

    const isAuthenticated = !!user;

    const login = useCallback((userToLogin: SessionUser) => {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(userToLogin));
        setUser(userToLogin);
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(VIEW_KEY);
        setUser(null);
    }, []);

    const saveView = useCallback((view: string) => {
        sessionStorage.setItem(VIEW_KEY, view);
    }, []);

    const getSavedView = useCallback(() => {
        return sessionStorage.getItem(VIEW_KEY) || 'home';
    }, []);

    return { isAuthenticated, user, login, logout, saveView, getSavedView };
};
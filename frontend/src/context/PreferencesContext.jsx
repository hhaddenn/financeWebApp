import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { getSettings, updateSettings } from '@/api/settings';
import { useAuth } from '@/features/auth/AuthContext';

import pt from '@/locales/pt';
import en from '@/locales/en';

const translations = {
	pt,
	en,
};

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
	const { isLoggedIn, isLoading: authLoading } = useAuth();

	const [language, setLanguageState] = useState('pt');
	const [theme, setThemeState] = useState('light');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (authLoading) {
			return;
		}

		if (!isLoggedIn) {
			setLanguageState('pt');
			setThemeState('light');
			setLoading(false);
			return;
		}

		const loadPreferences = async () => {
			setLoading(true);

			try {
				const settings = await getSettings();

				setLanguageState(settings.language || 'pt');
				setThemeState(settings.theme || 'light');
			} catch (error) {
				console.error('Failed to load preferences:', error);

				setLanguageState('pt');
				setThemeState('light');
			} finally {
				setLoading(false);
			}
		};

		loadPreferences();
	}, [isLoggedIn, authLoading]);

	useEffect(() => {
		const root = document.documentElement;

		root.classList.remove('light', 'dark');

		if (theme === 'system') {
			const systemDark = window.matchMedia(
				'(prefers-color-scheme: dark)',
			).matches;

			root.classList.add(systemDark ? 'dark' : 'light');

			return;
		}

		root.classList.add(theme);
	}, [theme]);

	const setLanguage = async (newLanguage) => {
		setLanguageState(newLanguage);

		try {
			await updateSettings({
				language: newLanguage,
			});
		} catch (error) {
			console.error('Failed to update language:', error);
		}
	};

	const setTheme = async (newTheme) => {
		setThemeState(newTheme);

		try {
			await updateSettings({
				theme: newTheme,
			});
		} catch (error) {
			console.error('Failed to update theme:', error);
		}
	};

	const t = (path) => {
		const value = path
			.split('.')
			.reduce((current, key) => current?.[key], translations[language]);

		return value ?? path;
	};

	const normalizeTranslationKey = (name) => {
   	if (!name || typeof name !== 'string') {
      	return name;
   	}

   	return name.replace(/\s+/g, '');
	};

	const translateCategory = (name) => {
	   const key = normalizeTranslationKey(name);
	
	   return translations[language]?.categories?.[key] ?? name;
	};
	
	const translateSubcategory = (name) => {
	   const key = normalizeTranslationKey(name);
	
	   return translations[language]?.subcategories?.[key] ?? name;
	};

	const value = useMemo(
		() => ({
			language,
			theme,
			loading,
			setLanguage,
			setTheme,
			t,
			translateCategory,
			translateSubcategory,
		}),
		[language, theme, loading],
	);

	return (
		<PreferencesContext.Provider value={value}>
			{children}
		</PreferencesContext.Provider>
	);
}

export function usePreferences() {
	const context = useContext(PreferencesContext);

	if (!context) {
		throw new Error('usePreferences must be used inside PreferencesProvider');
	}

	return context;
}

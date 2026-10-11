/* oxlint-disable react/only-export-components */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { getSettings, updateSettings } from "@/api/settings";
import { useAuth } from "@/features/auth/AuthContext";

import pt from "@/locales/pt";
import en from "@/locales/en";

const translations = {
    pt,
    en,
};

const PreferencesContext = createContext(null);

const normalizeTranslationKey = (name) => {
    if (!name || typeof name !== "string") {
        return name;
    }

    return name.replace(/\s+/g, "");
};

export function PreferencesProvider({ children }) {
    const { isLoggedIn, isLoading: authLoading } = useAuth();

    const [language, setLanguageState] = useState(() => {
        const savedLanguage = localStorage.getItem("financeapp.language");

        return ["pt", "en"].includes(savedLanguage) ? savedLanguage : "pt";
    });
    const [theme, setThemeState] = useState(() => {
        const savedTheme = localStorage.getItem("financeapp.theme");

        return ["light", "dark", "system"].includes(savedTheme)
            ? savedTheme
            : "system";
    });
    const [systemDark, setSystemDark] = useState(
        () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    );
    const [loading, setLoading] = useState(true);

    /* oxlint-disable react/set-state-in-effect */
    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!isLoggedIn) {
            setLoading(false);
            return;
        }

        const loadPreferences = async () => {
            setLoading(true);

            try {
                const settings = await getSettings();
                const backendTheme = ["light", "dark", "system"].includes(
                    settings.theme,
                )
                    ? settings.theme
                    : "system";
                const backendLanguage = ["pt", "en"].includes(settings.language)
                    ? settings.language
                    : "pt";

                setLanguageState(backendLanguage);
                localStorage.setItem("financeapp.language", backendLanguage);
                setThemeState(backendTheme);
                localStorage.setItem("financeapp.theme", backendTheme);
            } catch (error) {
                console.error("Failed to load preferences:", error);
            } finally {
                setLoading(false);
            }
        };

        loadPreferences();
    }, [isLoggedIn, authLoading]);
    /* oxlint-enable react/set-state-in-effect */

    useEffect(() => {
        const root = document.documentElement;

        root.classList.remove("light", "dark");

        if (theme === "system") {
            const mediaQuery = window.matchMedia(
                "(prefers-color-scheme: dark)",
            );

            const handleChange = (event) => {
                root.classList.remove("light", "dark");
                root.classList.add(event.matches ? "dark" : "light");
                setSystemDark(event.matches);
            };

            root.classList.add(mediaQuery.matches ? "dark" : "light");

            mediaQuery.addEventListener("change", handleChange);

            return () => {
                mediaQuery.removeEventListener("change", handleChange);
            };
        }

        root.classList.add(theme);
    }, [theme]);

    const resolvedTheme =
        theme === "system" ? (systemDark ? "dark" : "light") : theme;

    const setLanguage = useCallback(
        async (newLanguage) => {
            setLanguageState(newLanguage);
            localStorage.setItem("financeapp.language", newLanguage);

            if (isLoggedIn) {
                try {
                    await updateSettings({
                        language: newLanguage,
                    });
                } catch (error) {
                    console.error("Failed to update language:", error);
                }
            }
        },
        [isLoggedIn],
    );

    const setTheme = useCallback(
        async (newTheme) => {
            setThemeState(newTheme);

            localStorage.setItem("financeapp.theme", newTheme);

            if (isLoggedIn) {
                try {
                    await updateSettings({
                        theme: newTheme,
                    });
                } catch (error) {
                    console.error("Failed to update theme:", error);
                }
            }
        },
        [isLoggedIn],
    );

    const t = useCallback(
        (path) => {
            const value = path
                .split(".")
                .reduce(
                    (current, key) => current?.[key],
                    translations[language],
                );

            return value ?? path;
        },
        [language],
    );

    const translateCategory = useCallback(
        (name) => {
            const key = normalizeTranslationKey(name);

            return translations[language]?.categories?.[key] ?? name;
        },
        [language],
    );

    const translateSubcategory = useCallback(
        (name) => {
            const key = normalizeTranslationKey(name);

            return translations[language]?.subcategories?.[key] ?? name;
        },
        [language],
    );

    const value = useMemo(
        () => ({
            language,
            theme,
            loading,
            setLanguage,
            setTheme,
            isLoggedIn,
            t,
            translateCategory,
            translateSubcategory,
            resolvedTheme,
        }),
        [
            language,
            theme,
            loading,
            isLoggedIn,
            setLanguage,
            setTheme,
            t,
            translateCategory,
            translateSubcategory,
            resolvedTheme,
        ],
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
        throw new Error(
            "usePreferences must be used inside PreferencesProvider",
        );
    }

    return context;
}

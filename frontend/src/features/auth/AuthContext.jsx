import { createContext, useContext, useEffect, useState } from 'react';
import {
	login as loginRequest,
	logout as logoutRequest,
	refreshAccessToken,
	verifyLogin,
} from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const restoreSession = async () => {
			try {
				await refreshAccessToken();
				setIsLoggedIn(true);
			} catch {
				setIsLoggedIn(false);
			} finally {
				setIsLoading(false);
			}
		};

		restoreSession();
	}, []);

	const login = async (username, password) => {
		return loginRequest(username, password);
	};

	const completeLogin = async (challengeId, code) => {
		const data = await verifyLogin(challengeId, code);

		setIsLoggedIn(true);

		return data;
	};

	const logout = async () => {
		try {
			await logoutRequest();
		} finally {
			setIsLoggedIn(false);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				isLoggedIn,
				isLoading,
				login,
				completeLogin,
				logout,
			}}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error('useAuth must be used inside an AuthProvider');
	}

	return context;
}

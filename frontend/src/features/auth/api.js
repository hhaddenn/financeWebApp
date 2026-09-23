// Authentication API requests.

import api, { setAccessToken } from '@/api/client';

export const ensureCsrfToken = async () => {
	await api.get('/auth/csrf/');
};

export const login = async (username, password, rememberMe) => {
	await ensureCsrfToken();

	const response = await api.post('/auth/login/', {
		username,
		password,
		remember_me: rememberMe,
	});

	setAccessToken(response.data.access);

	return response.data;
};

export const verifyLogin = async (challengeId, code) => {
	await ensureCsrfToken();

	const response = await api.post('/auth/login/verify/', {
		challenge_id: challengeId,
		code,
	});

	setAccessToken(response.data.access);

	return response.data;
};

export const register = async (username, email, password) => {
	const response = await api.post('/auth/register/', {
		username,
		email,
		password,
	});

	return response.data;
};

export const verifyEmail = async (uid, token) => {
	const response = await api.get(`/auth/verify-email/${uid}/${token}/`);
	return response.data;
};

export const requestPasswordReset = async (email) => {
	await ensureCsrfToken();
	const response = await api.post('/auth/password-reset/', { email });
	return response.data;
};

export const confirmPasswordReset = async (uid, token, password) => {
	await ensureCsrfToken();
	const response = await api.post(
		`/auth/password-reset/confirm/${uid}/${token}/`,
		{ password },
	);
	return response.data;
};

export const refreshAccessToken = async () => {
	await ensureCsrfToken();

	const response = await api.post('/auth/refresh/');

	setAccessToken(response.data.access);

	return response.data.access;
};

export const getUser = async () => {
	const response = await api.get('/auth/me/');
	return response.data;
};

export const logout = async () => {
	try {
		await ensureCsrfToken();
		await api.post('/auth/logout/');
	} finally {
		setAccessToken(null);
	}
};

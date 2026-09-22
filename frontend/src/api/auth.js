// src/api/auth.js

import api, { setAccessToken } from './client';

export const ensureCsrfToken = async () => {
	await api.get('/auth/csrf/');
};

export const login = async (username, password) => {
	await ensureCsrfToken();

	const response = await api.post('/auth/login/', {
		username,
		password,
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

	setAccessToken(response.data.access);

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

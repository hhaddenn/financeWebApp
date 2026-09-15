// src/api/auth.js

import api, { setAccessToken } from './client';

export const login = async (username, password) => {
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
	try {
		const response = await api.post('/auth/refresh/');

		setAccessToken(response.data.access);

		return response.data.access;
	} catch (error) {
		console.error('Refresh failed:', error.response?.data);
		console.error('Status:', error.response?.status);
		throw error;
	}
};

export const logout = async () => {
	try {
		await api.post('/auth/logout/');
	} finally {
		setAccessToken(null);
	}
};

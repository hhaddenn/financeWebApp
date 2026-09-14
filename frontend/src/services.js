import axios from 'axios';

const api = axios.create({
	baseURL: 'http://localhost:8000/api',
	withCredentials: true,
});

let accessToken = null;

export const setAccessToken = (token) => {
	accessToken = token;
};

export const getAccessToken = () => {
	return accessToken;
};

api.interceptors.request.use((config) => {
	if (accessToken) {
		config.headers.Authorization = `Bearer ${accessToken}`;
	}

	return config;
});

export const login = async (username, password) => {
	const response = await api.post('/auth/login/', {
		username,
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
		accessToken = null;
	}
};

export default api;

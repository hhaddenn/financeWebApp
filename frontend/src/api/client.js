import axios from 'axios';

const api = axios.create({
	baseURL: 'http://localhost:8000/api',
	withCredentials: true,
});

let accessToken = null;

export const setAccessToken = (token) => {
	accessToken = token;
};

api.interceptors.request.use((config) => {
	if (accessToken) {
		config.headers.Authorization = `Bearer ${accessToken}`;
	}

	return config;
});

export default api;

import axios from 'axios';

const api = axios.create({
	baseURL: 'http://localhost:8000/api',
	withCredentials: true,
});

let accessToken = null;
let refreshPromise = null;

export const setAccessToken = (token) => {
	accessToken = token;
};

api.interceptors.request.use((config) => {
	if (accessToken) {
		config.headers.Authorization = `Bearer ${accessToken}`;
	}

	return config;
});

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		const isUnauthorized = error.response?.status === 401;
		const alreadyRetried = originalRequest?._retry;
		const isAuthEndpoint =
			originalRequest?.url?.includes('/auth/login/') ||
			originalRequest?.url?.includes('/auth/register/') ||
			originalRequest?.url?.includes('/auth/refresh/') ||
			originalRequest?.url?.includes('/auth/logout/');

		if (isUnauthorized && !alreadyRetried && !isAuthEndpoint) {
			originalRequest._retry = true;

			try {
				if (!refreshPromise) {
					refreshPromise = api
						.post('/auth/refresh/')
						.then((response) => {
							const newAccessToken = response.data.access;
							setAccessToken(newAccessToken);
							return newAccessToken;
						})
						.finally(() => {
							refreshPromise = null;
						});
				}

				const newAccessToken = await refreshPromise;

				originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

				return api(originalRequest);
			} catch (refreshError) {
				setAccessToken(null);
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	},
);

export default api;

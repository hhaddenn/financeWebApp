import api from './client';

export const getNews = async () => {
	const response = await api.get('/news/');
	return response.data;
};

export const markNewsAsRead = async (id) => {
	await api.post(`/news/${id}/read/`);
};

export const getNewsById = async (id) => {
	const response = await api.get(`/news/${id}/`);
	return response.data;
};
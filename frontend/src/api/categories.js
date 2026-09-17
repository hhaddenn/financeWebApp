import api from './client';

export const getCategories = async () => {
	const response = await api.get('/categories');
	return response.data;
};

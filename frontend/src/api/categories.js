import api from './client';

export const getCategories = async () => {
	const response = await api.get('/categories/');
	return response.data;
};

export const getSubcategories = async () => {
	const response = await api.get('/subcategories/');
	return response.data;
};

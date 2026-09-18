import api from './client';

export const getCategories = async (categoryType) => {
	const response = await api.get('/categories/', {
		params: { category_type: categoryType },
	});

	return response.data;
};

export const getSubcategories = async () => {
	const response = await api.get('/subcategories/');
	return response.data;
};

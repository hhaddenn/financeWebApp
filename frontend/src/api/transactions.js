import api from './client';

export const getTransactions = async () => {
	const response = await api.get('/transactions/');
	return response.data;
};

export const createTransaction = async (data) => {
	const response = await api.post('/transactions/create', data);
	return response.data;
};

export const updateTransaction = async (id, data) => {
	const response = await api.put(`/transactions/${id}`, data);
	return response.data;
};

export const deleteTransaction = async (id) => {
	const response = await api.delete(`/transactions/${id}`);
	return response.data;
};

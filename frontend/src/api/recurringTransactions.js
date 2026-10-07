import api from './client';

export const getRecurringTransactions = async (filters = {}) => {
   const response = await api.get('/recurring-transactions/', {
      params: filters,
   });

   return response.data;
};

export const createRecurringTransaction = async (data) => {
   const response = await api.post('/recurring-transactions/create', data);

   return response.data;
};

export const updateRecurringTransaction = async (id, data) => {
   const response = await api.patch(`/recurring-transactions/${id}`, data);

   return response.data;
};

export const deleteRecurringTransaction = async (id) => {
   const response = await api.delete(`/recurring-transactions/${id}`);

   return response.data;
};

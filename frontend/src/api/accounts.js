import api from './client';

export const getAccounts = async () => {
   const response = await api.get('/accounts/');
   return response.data;
};

export const createAccount = async (accountData) => {
   const response = await api.post('/accounts/create', accountData);
   return response.data;
};

export const updateAccount = async (id, accountData) => {
   const response = await api.patch(`/accounts/${id}`, accountData);
   return response.data;
};

export const deleteAccount = async (id) => {
   await api.delete(`/accounts/${id}`);
};
import api from './client';

export const sendFeedback = async (data) => {
  const response = await api.post('/feedback/', data);
  return response.data;
};
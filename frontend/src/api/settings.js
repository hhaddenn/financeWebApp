import api from './client';

export const getSettings = async () => {
  const response = await api.get('/settings/');
  return response.data;
};

export const updateSettings = async (data) => {
  const response = await api.patch('/settings/', data);
  return response.data;
};

export const getCategoryPreferences = async () => {
  const response = await api.get('/settings/categories/');
  return response.data;
};

export const updateCategoryPreference = async (id, data) => {
  const response = await api.patch(`/settings/categories/${id}/`, data);
  return response.data;
};

export const getSubcategoryPreferences = async () => {
  const response = await api.get('/settings/subcategories/');
  return response.data;
};

export const updateSubcategoryPreference = async (id, data) => {
  const response = await api.patch(`/settings/subcategories/${id}/`, data);
  return response.data;
};
import api from './client';

export const getAccount = async () => (await api.get('/auth/account/')).data;

export const updateUsername = async (data) =>
	(await api.patch('/auth/account/', data)).data;

export const changePassword = async (data) =>
	(await api.post('/auth/account/password/', data)).data;

export const requestEmailChange = async (data) =>
	(await api.post('/auth/account/email/', data)).data;

export const confirmEmailChange = async (uid, token) =>
	(await api.post(`/auth/account/email/confirm/${uid}/${token}/`)).data;

export const logoutAll = async () =>
	(await api.post('/auth/account/logout-all/')).data;

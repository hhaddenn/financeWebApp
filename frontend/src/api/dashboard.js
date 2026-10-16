import api from "./client";

export const getDashboardSummary = async (period = "year") => {
	const response = await api.get("/dashboard/summary/", {
		params: { period },
	});

	return response.data;
};

export const getDashboardCategorySummary = async (
	transaction_type = "expense",
	period = "month",
) => {
	const response = await api.get("/dashboard/categories/summary/", {
		params: {
			transaction_type,
			period,
		},
	});

	return response.data;
};

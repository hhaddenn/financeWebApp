import api from "./client";

export const getDashboardSummary = async (period = "year") => {
	const response = await api.get("/dashboard/summary/", {
		params: { period },
	});

	return response.data;
};

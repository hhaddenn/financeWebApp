import { Navigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthContext';

export default function ProtectedRoute({ children }) {
	const { isLoggedIn, isLoading } = useAuth();

	if (isLoading) {
		return null;
	}

	if (!isLoggedIn) {
		return <Navigate to="/login" replace />;
	}

	return children;
}

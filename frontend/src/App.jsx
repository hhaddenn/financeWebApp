import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthContext';

import Login from '@/features/auth/pages/Login';
import Register from '@/features/auth/pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Settings from './pages/Settings';
import VerifyEmail from '@/features/auth/pages/VerifyEmail';
import ForgotPassword from '@/features/auth/pages/ForgotPassword';
import ResetPassword from '@/features/auth/pages/ResetPassword';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';

function App() {
	const { isLoggedIn, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#eff6ff]">
				<p>Loading...</p>
			</div>
		);
	}

	return (
		<Router>
			<AppLayout>
				<Routes>
					<Route
						path="/login"
						element={
							isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />
						}
					/>

					<Route
						path="/register"
						element={
							isLoggedIn ? <Navigate to="/dashboard" replace /> : <Register />
						}
					/>

					<Route path="/verify-email/:uid/:token" element={<VerifyEmail />} />
					<Route path="/forgot-password" element={<ForgotPassword />} />
					<Route
						path="/reset-password/:uid/:token"
						element={<ResetPassword />}
					/>

					<Route
						path="/dashboard"
						element={
							<ProtectedRoute>
								<Dashboard />
							</ProtectedRoute>
						}
					/>

					<Route
						path="/transactions"
						element={
							<ProtectedRoute>
								<Transactions />
							</ProtectedRoute>
						}
					/>

					<Route
						path="/settings"
						element={
							<ProtectedRoute>
								<Settings />
							</ProtectedRoute>
						}
					/>

					<Route
						path="/news"
						element={
							<ProtectedRoute>
								<News />
							</ProtectedRoute>
						}
					/>

					<Route
						path="/news/:id"
						element={
							<ProtectedRoute>
								<NewsDetail />
							</ProtectedRoute>
						}
					/>

					<Route
						path="/"
						element={
							<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />
						}
					/>
				</Routes>
			</AppLayout>
		</Router>
	);
}

export default App;

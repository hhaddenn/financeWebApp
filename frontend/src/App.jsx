import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from 'react-router-dom';

import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Settings from './pages/Settings';

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

					<Route
						path="/dashboard"
						element={
							<ProtectedRoute>
								<Dashboard />
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

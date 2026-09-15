import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from 'react-router-dom';

import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from "./pages/Register";
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
	const { isLoggedIn, isLoading } = useAuth();

	if (isLoading) {
		return <p>Loading...</p>;
	}

	return (
		<Router>
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
					path="/"
					element={
						<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />
					}
				/>
			</Routes>
		</Router>
	);
}

export default App;

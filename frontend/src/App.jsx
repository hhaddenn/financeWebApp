import { useEffect, useState } from 'react';
import LoginForm from './components/auth/LoginForm';
import { refreshAccessToken } from './services';
import './App.css';

function App() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const restoreSession = async () => {
			try {
				await refreshAccessToken();
				setIsLoggedIn(true);
			} catch {
				setIsLoggedIn(false);
			} finally {
				setIsLoading(false);
			}
		};

		restoreSession();
	}, []);

	if (isLoading) {
		return <p>Loading...</p>;
	}

	return (
		<>
			{isLoggedIn ? (
				<p>You are logged in!</p>
			) : (
				<LoginForm onLoginSuccess={() => setIsLoggedIn(true)} />
			)}
		</>
	);
}

export default App;

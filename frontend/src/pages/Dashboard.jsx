import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
	const { logout } = useAuth();

	return (
		<div className="w-96 mx-auto p-4 bg-white rounded shadow-md">
			<h1 className="block text-lg font-medium">Dashboard</h1>

			<button
				className="bg-blue-500 hover:bg-blue-700 hover:cursor-pointer text-white font-bold py-2 px-4 rounded"
				onClick={logout}>
				Logout
			</button>
		</div>
	);
}

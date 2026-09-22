import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { PreferencesProvider } from './context/PreferencesContext.jsx';

import './index.css';

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<AuthProvider>
			<PreferencesProvider>
				<App />
			</PreferencesProvider>
		</AuthProvider>
	</StrictMode>,
);

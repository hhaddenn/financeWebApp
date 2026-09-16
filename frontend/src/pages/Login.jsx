import LoginForm from '../components/auth/LoginForm';

export default function Login() {
	return (
		<div className="flex min-h-svh items-center justify-center bg-muted p-6 md:p-10">
			<div className="w-full max-w-md">
				<LoginForm />
			</div>
		</div>
	);
}

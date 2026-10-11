import LoginForm from "@/features/auth/components/LoginForm";
import AuthLayout from "@/features/auth/components/AuthLayout";

export default function Login() {
    return (
        <AuthLayout>
            <LoginForm />
        </AuthLayout>
    );
}

import LanguageSwitcher from "./LanguageSwitcher";

export default function AuthLayout({ children }) {
    return (
        <main className="relative flex min-h-svh items-center justify-center bg-muted p-6 md:p-10">
            <div className="absolute top-6 right-6">
                <LanguageSwitcher />
            </div>

            <div className="w-full max-w-md">{children}</div>
        </main>
    );
}

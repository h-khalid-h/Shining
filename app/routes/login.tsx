import { SignIn } from '@clerk/react-router';

export default function Login() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-bolt-elements-background-depth-1">
            <SignIn routing="path" path="/login" signUpUrl="/sign-up" forceRedirectUrl="/onboarding" />
        </div>
    );
}

'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from './button';
import { Input } from './input';
import { Logo } from './logo';
import { PaperDesignBackground } from './neon-dither';
import { createClient } from '@/lib/supabase/client';
import {
	AtSign,
	ChevronLeft,
	Lock,
	User,
	AlertCircle,
} from 'lucide-react';

// Memoized left panel to prevent remounting
const AuthLeftPanel = React.memo(() => (
	<div className="relative hidden h-full flex-col border-r border-gray-2000 p-10 lg:flex overflow-hidden">
		<PaperDesignBackground themeMode="dark" intensity={0.6} parallax={false} className="absolute inset-0 z-0" />
		<div className="z-10 flex items-center gap-2 relative">
			<Logo />
		</div>
	</div>
));
AuthLeftPanel.displayName = 'AuthLeftPanel';

interface UnifiedAuthPageProps {
	invitationToken?: string;
}

export function UnifiedAuthPage({ invitationToken }: UnifiedAuthPageProps = {}) {
	const pathname = usePathname();
	const router = useRouter();
	const [mode, setMode] = React.useState<'signin' | 'signup'>(pathname === '/signin' ? 'signin' : 'signup');
	const isSignin = mode === 'signin';

	// Sync with pathname changes from external navigation (only on mount and direct navigation)
	React.useEffect(() => {
		const currentMode = pathname === '/signin' ? 'signin' : 'signup';
		setMode(currentMode);
	}, [pathname]); // Only sync on pathname change from external navigation

	const switchMode = (newMode: 'signin' | 'signup') => {
		setMode(newMode);
		const newPath = newMode === 'signin' ? '/signin' : '/signup';
		// Use pushState to update URL without triggering Next.js navigation/re-render
		window.history.pushState({}, '', newPath);
	};

	return (
		<main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
			{/* Left Panel - Static, doesn't reload */}
			<AuthLeftPanel />

			{/* Right Panel - Form content */}
			<div className="relative flex min-h-screen flex-col justify-center p-4">
				<div
					aria-hidden
					className="absolute inset-0 isolate contain-strict -z-10 opacity-60"
				>
					<div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full" />
					<div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
					<div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full" />
				</div>
				<Button variant="ghost" className="absolute top-7 left-5" asChild>
					<Link href="/">
						<ChevronLeft className='size-4 me-2' />
						Home
					</Link>
				</Button>
				<div className="mx-auto space-y-4 sm:w-sm">
					<div className="flex items-center gap-2 lg:hidden">
						<Logo />
					</div>
					
					{isSignin ? <SignInForm switchToSignup={() => switchMode('signup')} invitationToken={invitationToken} /> : <SignUpForm switchToSignin={() => switchMode('signin')} invitationToken={invitationToken} />}
				</div>
			</div>
		</main>
	);
}

function SignInForm({ switchToSignup, invitationToken }: { switchToSignup: () => void; invitationToken?: string }) {
	const router = useRouter();
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [message, setMessage] = React.useState<string | null>(null);

	const handleGoogleSignIn = async () => {
		try {
			setLoading(true);
			setError(null);
			const supabase = createClient();
			const { error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: invitationToken 
						? `${window.location.origin}/api/auth/callback?invitation=${encodeURIComponent(invitationToken)}`
						: `${window.location.origin}/api/auth/callback`,
				},
			});
			if (error) throw error;
		} catch (err: any) {
			setError(err.message || 'Failed to sign in with Google');
			setLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setMessage(null);

		const formData = new FormData(e.currentTarget);
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		try {
			const response = await fetch('/api/auth/signin', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to sign in');
			}

			// Get user role and redirect to appropriate portal
			const supabase = createClient();
			const { data: { user } } = await supabase.auth.getUser();
			
			// If there's an invitation token, redirect to accept it
			if (invitationToken) {
				router.push(`/accept-invitation/${invitationToken}`);
				router.refresh();
				return;
			}
			
			const userRole = user?.user_metadata?.role || 'user';
			const isSuperAdmin = user?.user_metadata?.is_super_admin === true || userRole === 'super_admin';
			
			// Redirect based on role
			router.push(isSuperAdmin ? '/admin' : '/org');
			router.refresh();
		} catch (err: any) {
			setError(err.message || 'An error occurred');
			setLoading(false);
		}
	};

	return (
		<>
			<div className="flex flex-col space-y-1">
				<h1 className="font-heading text-2xl font-bold tracking-wide">
					Welcome back!
				</h1>
				<p className="text-muted-foreground text-base">
					Sign in to your context account.
				</p>
			</div>
			{error && (
				<div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					<AlertCircle className="size-4" />
					<span>{error}</span>
				</div>
			)}
			{message && (
				<div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
					<span>{message}</span>
				</div>
			)}
			<div className="space-y-2">
				<Button 
					type="button" 
					size="lg" 
					className="w-full"
					onClick={handleGoogleSignIn}
					disabled={loading}
				>
					<GoogleIcon className='size-4 me-2' />
					Continue with Google
				</Button>
			</div>

			<AuthSeparator />

			<form className="space-y-4" onSubmit={handleSubmit}>
				<p className="text-muted-foreground text-start text-xs">
					Enter your email address to sign in
				</p>
				<div className="relative h-max">
					<Input
						placeholder="your.email@example.com"
						className="peer ps-9"
						type="email"
						name="email"
						required
						disabled={loading}
					/>
					<div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
						<AtSign className="size-4" aria-hidden="true" />
					</div>
				</div>
				<div className="relative h-max">
					<Input
						placeholder="Password"
						className="peer ps-9"
						type="password"
						name="password"
						required
						disabled={loading}
					/>
					<div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
						<Lock className="size-4" aria-hidden="true" />
					</div>
				</div>

				<div className="flex justify-end">
					<Link
						href="/reset-password"
						className="text-muted-foreground hover:text-primary text-xs underline underline-offset-4"
					>
						Forgot password?
					</Link>
				</div>

				<Button type="submit" className="w-full" disabled={loading}>
					<span>{loading ? 'Signing in...' : 'Sign In'}</span>
				</Button>
			</form>
			<div className="mt-8 space-y-4">
				<p className="text-muted-foreground text-center text-sm">
					Don't have an account?{' '}
					<button
						type="button"
						onClick={switchToSignup}
						className="hover:text-primary underline underline-offset-4 font-medium font-heading"
						disabled={loading}
					>
						Sign up
					</button>
				</p>
				<p className="text-muted-foreground text-center text-xs">
					By signing in, you agree to our{' '}
					<Link
						href="#"
						className="hover:text-primary underline underline-offset-4"
					>
						Terms of Service
					</Link>{' '}
					and{' '}
					<Link
						href="#"
						className="hover:text-primary underline underline-offset-4"
					>
						Privacy Policy
					</Link>
					.
				</p>
			</div>
		</>
	);
}

function SignUpForm({ switchToSignin, invitationToken }: { switchToSignin: () => void; invitationToken?: string }) {
	const router = useRouter();
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [message, setMessage] = React.useState<string | null>(null);

	const handleGoogleSignUp = async () => {
		try {
			setLoading(true);
			setError(null);
			const supabase = createClient();
			const { error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: invitationToken 
						? `${window.location.origin}/api/auth/callback?invitation=${encodeURIComponent(invitationToken)}`
						: `${window.location.origin}/api/auth/callback`,
				},
			});
			if (error) throw error;
		} catch (err: any) {
			setError(err.message || 'Failed to sign up with Google');
			setLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setMessage(null);

		const formData = new FormData(e.currentTarget);
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (password !== confirmPassword) {
			setError('Passwords do not match');
			setLoading(false);
			return;
		}

		if (password.length < 6) {
			setError('Password must be at least 6 characters long');
			setLoading(false);
			return;
		}

		try {
			const response = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, name, invitationToken }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to sign up');
			}

			// If there's an invitation token, redirect to accept it after signup
			if (invitationToken && data.user) {
				// Small delay to ensure user is created, then redirect
				setTimeout(() => {
					router.push(`/accept-invitation/${invitationToken}`);
					router.refresh();
				}, 500);
				return;
			}

			setMessage(data.message || 'Account created! Please check your email to verify your account.');
			setError(null);
		} catch (err: any) {
			setError(err.message || 'An error occurred');
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<div className="flex flex-col space-y-1">
				<h1 className="font-heading text-2xl font-bold tracking-wide">
					Create your account
				</h1>
				<p className="text-muted-foreground text-base">
					Sign up to get started with context.
				</p>
			</div>
			{error && (
				<div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					<AlertCircle className="size-4" />
					<span>{error}</span>
				</div>
			)}
			{message && (
				<div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
					<span>{message}</span>
				</div>
			)}
			<div className="space-y-2">
				<Button 
					type="button" 
					size="lg" 
					className="w-full"
					onClick={handleGoogleSignUp}
					disabled={loading}
				>
					<GoogleIcon className='size-4 me-2' />
					Continue with Google
				</Button>
			</div>

			<AuthSeparator />

			<form className="space-y-4" onSubmit={handleSubmit}>
				<div className="relative h-max">
					<Input
						placeholder="Full name"
						className="peer ps-9"
						type="text"
						name="name"
						required
						disabled={loading}
					/>
					<div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
						<User className="size-4" aria-hidden="true" />
					</div>
				</div>
				<div className="relative h-max">
					<Input
						placeholder="your.email@example.com"
						className="peer ps-9"
						type="email"
						name="email"
						required
						disabled={loading}
					/>
					<div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
						<AtSign className="size-4" aria-hidden="true" />
					</div>
				</div>
				<div className="relative h-max">
					<Input
						placeholder="Password"
						className="peer ps-9"
						type="password"
						name="password"
						required
						disabled={loading}
						minLength={6}
					/>
					<div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
						<Lock className="size-4" aria-hidden="true" />
					</div>
				</div>
				<div className="relative h-max">
					<Input
						placeholder="Confirm password"
						className="peer ps-9"
						type="password"
						name="confirmPassword"
						required
						disabled={loading}
						minLength={6}
					/>
					<div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
						<Lock className="size-4" aria-hidden="true" />
					</div>
				</div>

				<Button type="submit" className="w-full" disabled={loading}>
					<span>{loading ? 'Creating account...' : 'Create Account'}</span>
				</Button>
			</form>
			<div className="mt-8 space-y-4">
				<p className="text-muted-foreground text-center text-sm">
					Already have an account?{' '}
					<button
						type="button"
						onClick={switchToSignin}
						className="hover:text-primary underline underline-offset-4 font-medium font-heading"
						disabled={loading}
					>
						Sign in
					</button>
				</p>
				<p className="text-muted-foreground text-center text-xs">
					By creating an account, you agree to our{' '}
					<Link
						href="#"
						className="hover:text-primary underline underline-offset-4"
					>
						Terms of Service
					</Link>{' '}
					and{' '}
					<Link
						href="#"
						className="hover:text-primary underline underline-offset-4"
					>
						Privacy Policy
					</Link>
					.
				</p>
			</div>
		</>
	);
}

const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		{...props}
	>
		<g>
			<path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
		</g>
	</svg>
);

const AuthSeparator = () => {
	return (
		<div className="flex w-full items-center justify-center">
			<div className="bg-border h-px w-full" />
			<span className="text-muted-foreground px-2 text-xs">OR</span>
			<div className="bg-border h-px w-full" />
		</div>
	);
};

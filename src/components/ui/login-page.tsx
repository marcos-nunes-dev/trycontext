'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from './button';
import { Input } from './input';
import { Logo } from './logo';
import { PaperDesignBackground } from './neon-dither';
import {
	AtSignIcon,
	ChevronLeftIcon,
} from 'lucide-react';

export function LoginPage() {
	return (
		<main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
			<div className="relative hidden h-full flex-col border-r border-gray-2000 p-10 lg:flex overflow-hidden">
				<PaperDesignBackground themeMode="dark" intensity={0.6} parallax={false} className="absolute inset-0 z-0" />
				<div className="z-10 flex items-center gap-2 relative">
					<Logo />
				</div>
			</div>
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
						<ChevronLeftIcon className='size-4 me-2' />
						Home
					</Link>
				</Button>
				<div className="mx-auto space-y-4 sm:w-sm">
					<div className="flex items-center gap-2 lg:hidden">
						<Logo />
					</div>
					<div className="flex flex-col space-y-1">
						<h1 className="font-heading text-2xl font-bold tracking-wide">
							Welcome back!
						</h1>
						<p className="text-muted-foreground text-base">
							Sign in to your context account.
						</p>
					</div>
					<div className="space-y-2">
						<Button type="button" size="lg" className="w-full">
							<GoogleIcon className='size-4 me-2' />
							Continue with Google
						</Button>
					</div>

					<AuthSeparator />

					<form className="space-y-2">
						<p className="text-muted-foreground text-start text-xs">
							Enter your email address to sign in
						</p>
						<div className="relative h-max">
							<Input
								placeholder="your.email@example.com"
								className="peer ps-9"
								type="email"
							/>
							<div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
								<AtSignIcon className="size-4" aria-hidden="true" />
							</div>
						</div>

						<Button type="button" className="w-full">
							<span>Continue With Email</span>
						</Button>
					</form>
					<p className="text-muted-foreground mt-8 text-sm">
						Don't have an account?{' '}
						<Link
							href="/signup"
							className="hover:text-primary underline underline-offset-4"
						>
							Sign up
						</Link>
						. By signing in, you agree to our{' '}
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
			</div>
		</main>
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

'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { Logo } from '@/components/ui/logo'
import { PaperDesignBackground } from '@/components/ui/neon-dither'
import { cn } from '@/lib/utils'
import { useScroll } from 'motion/react'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring' as const,
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

export function HeroSection() {
    return (
        <>
            <PaperDesignBackground themeMode="dark" intensity={0.6} parallax={false} />
            <HeroHeader />
            <main className="overflow-hidden relative">
                <section>
                    <div className="relative pt-24">
                        <div className="mx-auto max-w-5xl px-6">
                            <div className="sm:mx-auto lg:mr-auto">
                                <AnimatedGroup
                                    variants={{
                                        container: {
                                            visible: {
                                                transition: {
                                                    staggerChildren: 0.05,
                                                    delayChildren: 0.75,
                                                },
                                            },
                                        },
                                        ...transitionVariants,
                                    }}
                                >
                                    <h1 className="mt-8 max-w-2xl text-balance text-5xl font-medium md:text-6xl lg:mt-16 font-heading">
                                        Transform conversations into product roadmaps
                                    </h1>
                                    <p className="mt-8 max-w-2xl text-pretty text-lg">
                                        Your AI-powered Product Manager that analyzes meetings, documents, and conversations to automatically generate organized epics, tickets, and roadmaps in Linear.
                                    </p>
                                    <div className="mt-12 flex items-center gap-2">
                                        <div
                                            key={1}
                                            className="bg-foreground/10 rounded-[14px] border border-gray-2000 p-0.5">
                                            <Button
                                                asChild
                                                size="lg"
                                                className="rounded-xl px-5 text-base bg-primary text-primary-foreground hover:bg-primary/90">
                                                <Link href="#link">
                                                    <span className="text-nowrap">Start Building</span>
                                                </Link>
                                            </Button>
                                        </div>
                                        <Button
                                            key={2}
                                            asChild
                                            size="lg"
                                            variant="ghost"
                                            className="h-[42px] rounded-xl px-5 text-base hover:bg-gray-2000">
                                            <Link href="#link">
                                                <span className="text-nowrap">Request a demo</span>
                                            </Link>
                                        </Button>
                                    </div>
                                </AnimatedGroup>
                            </div>
                        </div>
                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                            delayChildren: 0.75,
                                        },
                                    },
                                },
                                ...transitionVariants,
                            }}>
                            <div className="relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                                <div
                                    aria-hidden
                                    className="bg-gradient-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
                                />
                                <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-gray-2000 p-4 shadow-lg shadow-zinc-950/15 ring-1">
                                    <Image
                                        className="bg-background aspect-15/8 relative hidden rounded-2xl dark:block"
                                        src="https://images.unsplash.com/photo-1551650975-87deedd944c3?w=2700&q=75"
                                        alt="app screen"
                                        width={2700}
                                        height={1440}
                                        priority
                                    />
                                    <Image
                                        className="z-2 border-border/25 aspect-15/8 relative rounded-2xl border border-gray-2000 dark:hidden"
                                        src="https://images.unsplash.com/photo-1551650975-87deedd944c3?w=2700&q=75"
                                        alt="app screen"
                                        width={2700}
                                        height={1440}
                                        priority
                                    />
                                </div>
                            </div>
                        </AnimatedGroup>
                    </div>
                </section>
                <section className="bg-background pb-16 pt-16 md:pb-32">
                    <div className="group relative m-auto max-w-5xl px-6">
                        <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
                            <Link
                                href="/"
                                className="block text-sm duration-150 hover:opacity-75 text-foreground">
                                <span> Meet Our Customers</span>
                                <ChevronRight className="ml-1 inline-block size-3" />
                            </Link>
                        </div>
                        <div className="group-hover:blur-xs mx-auto mt-12 grid max-w-2xl grid-cols-4 gap-x-12 gap-y-8 transition-all duration-500 group-hover:opacity-50 sm:gap-x-16 sm:gap-y-14">
                            <div className="flex">
                                <Image
                                    className="mx-auto h-5 w-fit dark:invert opacity-60"
                                    src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&q=75"
                                    alt="Customer Logo"
                                    height={20}
                                    width={100}
                                />
                            </div>
                            <div className="flex">
                                <Image
                                    className="mx-auto h-4 w-fit dark:invert opacity-60"
                                    src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&q=75"
                                    alt="Customer Logo"
                                    height={16}
                                    width={80}
                                />
                            </div>
                            <div className="flex">
                                <Image
                                    className="mx-auto h-4 w-fit dark:invert opacity-60"
                                    src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&q=75"
                                    alt="Customer Logo"
                                    height={16}
                                    width={80}
                                />
                            </div>
                            <div className="flex">
                                <Image
                                    className="mx-auto h-5 w-fit dark:invert opacity-60"
                                    src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&q=75"
                                    alt="Customer Logo"
                                    height={20}
                                    width={100}
                                />
                            </div>
                            <div className="flex">
                                <Image
                                    className="mx-auto h-5 w-fit dark:invert opacity-60"
                                    src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&q=75"
                                    alt="Customer Logo"
                                    height={20}
                                    width={100}
                                />
                            </div>
                            <div className="flex">
                                <Image
                                    className="mx-auto h-4 w-fit dark:invert opacity-60"
                                    src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&q=75"
                                    alt="Customer Logo"
                                    height={16}
                                    width={80}
                                />
                            </div>
                            <div className="flex">
                                <Image
                                    className="mx-auto h-7 w-fit dark:invert opacity-60"
                                    src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&q=75"
                                    alt="Customer Logo"
                                    height={28}
                                    width={140}
                                />
                            </div>
                            <div className="flex">
                                <Image
                                    className="mx-auto h-6 w-fit dark:invert opacity-60"
                                    src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&q=75"
                                    alt="Customer Logo"
                                    height={24}
                                    width={120}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}

const menuItems = [
    { name: 'Features', href: '#link' },
    { name: 'Solution', href: '#link' },
    { name: 'Pricing', href: '#link' },
    { name: 'About', href: '#link' },
]

export const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [scrolled, setScrolled] = React.useState(false)

    const { scrollYProgress } = useScroll()

    React.useEffect(() => {
        const unsubscribe = scrollYProgress.on('change', (latest) => {
            setScrolled(latest > 0.05)
        })
        return () => unsubscribe()
    }, [scrollYProgress])

    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className={cn('group fixed z-20 w-full border-b border-gray-2000 transition-colors duration-150', scrolled && 'bg-background/50 backdrop-blur-3xl')}>
                <div className="mx-auto max-w-5xl px-6 transition-all duration-300">
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <Logo />
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden text-foreground font-heading">
                                <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>

                            <div className="hidden lg:block">
                                <ul className="flex gap-8 text-sm">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-gray-1700 hover:text-foreground block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-gray-2000 p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-gray-1700 hover:text-foreground block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-2000 hover:bg-gray-2000">
                                    <Link href="/signin">
                                        <span>Login</span>
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    <Link href="/signup">
                                        <span>Sign Up</span>
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}


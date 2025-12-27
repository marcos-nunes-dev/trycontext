'use client'

import React, { useState, useRef, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink, SidebarToggle, useSidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, Settings, LogOut, Users, Shield, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminPortal({ children }: { children?: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const links = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: (
        <LayoutDashboard className="text-[#5A6063] h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: (
        <Users className="text-[#5A6063] h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Organizations",
      href: "/admin/organizations",
      icon: (
        <Shield className="text-[#5A6063] h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: (
        <Settings className="text-[#5A6063] h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? (
              <div className="flex items-center justify-between mb-4 h-6">
                <SidebarLogo />
                <SidebarToggle showDivider={false} className="w-auto" />
              </div>
            ) : (
              <div className="mb-4 h-6 flex items-center">
                <SidebarLogoIcon />
              </div>
            )}
            {!open && (
              <>
                <SidebarToggle />
                <div className="my-2 border-t border-gray-2000"></div>
              </>
            )}
            <div className="flex flex-col gap-2">
              {open && <div className="mb-2 border-t border-gray-2000"></div>}
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
              <SidebarLink
                link={{
                  label: "Logout",
                  href: "#",
                  icon: (
                    <LogOut className="text-[#5A6063] h-5 w-5 flex-shrink-0" />
                  ),
                }}
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  handleSignOut();
                }}
              />
            </div>
          </div>
          {user && <UserCard user={user} />}
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1 overflow-hidden bg-[#141515]">
        <div className="p-4 md:p-10 flex flex-col gap-4 flex-1 w-full h-full overflow-y-auto bg-black rounded-[30px_0px_30px_0px]">
          {children || (
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-heading font-bold text-foreground">Admin Portal</h1>
              <p className="text-muted-foreground font-sans">Welcome to the admin dashboard</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const SidebarLogo = ({ className }: { className?: string }) => {
  return (
    <Link
      href="/admin"
      className={cn("font-heading flex space-x-2 items-center text-sm text-foreground relative z-20 h-6", className)}
    >
      <Logo showText={true} width={24} height={24} className="flex items-center gap-2" />
    </Link>
  );
};

const SidebarLogoIcon = ({ className }: { className?: string }) => {
  return (
    <Link
      href="/admin"
      className={cn("font-heading flex space-x-2 items-center text-sm text-foreground relative z-20 h-6", className)}
    >
      <Logo showText={false} width={24} height={24} className="flex items-center gap-2" />
    </Link>
  );
};

const UserCard = ({ user }: { user: any }) => {
  const { open } = useSidebar();
  const { signOut } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  return (
    <div className="pt-2 relative" ref={menuRef}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={cn(
          "flex items-center gap-3 rounded-lg transition-colors w-full",
          open ? "bg-black hover:bg-gray-3900/70 p-3" : "p-2 justify-center"
        )}
      >
        {user.user_metadata?.avatar_url ? (
          <Image
            src={user.user_metadata.avatar_url}
            className={cn("shrink-0 rounded-full", open ? "h-10 w-10" : "h-8 w-8")}
            width={open ? 40 : 32}
            height={open ? 40 : 32}
            alt="Avatar"
          />
        ) : (
          <div className={cn("shrink-0 rounded-full bg-gray-2000 flex items-center justify-center", open ? "h-10 w-10" : "h-8 w-8")}>
            <span className={cn("text-foreground font-heading", open ? "text-xs" : "text-xs")}>
              {(user.user_metadata?.name?.[0] || user.email?.[0] || "U").toUpperCase()}
            </span>
          </div>
        )}
        {open && (
          <>
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="text-foreground text-sm font-sans font-medium truncate">
                {user.user_metadata?.name || "User"}
              </span>
              <span className="text-[var(--gray-1700)] text-xs font-sans truncate">
                {user.email}
              </span>
            </div>
            <ChevronDown className={cn("shrink-0 h-4 w-4 text-[#5A6063] transition-transform", isMenuOpen && "rotate-180")} />
          </>
        )}
      </button>
      
      {isMenuOpen && (
        <div className={cn(
          "absolute bottom-full left-0 mb-2 w-full bg-black border border-gray-2000 rounded-lg shadow-lg z-50 overflow-hidden",
          !open && "left-1/2 -translate-x-1/2 w-48"
        )}>
          <Link
            href="/admin/profile"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-3900/70 transition-colors text-foreground text-sm font-sans"
          >
            <Settings className="h-4 w-4 text-[#5A6063]" />
            <span>Profile Settings</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-3900/70 transition-colors text-foreground text-sm font-sans w-full text-left"
          >
            <LogOut className="h-4 w-4 text-[#5A6063]" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col bg-gray-4400 border-gray-2000 w-[300px] flex-shrink-0",
        className
      )}
      animate={{
        width: animate ? (open ? "300px" : "60px") : "300px",
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-gray-4400 border-b border-gray-2000 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-[#5A6063] cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-gray-4400 border-r border-gray-2000 p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-[#5A6063] cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <X />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  onClick,
  ...props
}: {
  link: Links;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  props?: LinkProps;
}) => {
  const { open, animate } = useSidebar();
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      e.preventDefault();
      onClick(e);
    }
  };

  // Clone icon and conditionally apply white color when sidebar is contracted
  const iconWithConditionalColor = React.isValidElement(link.icon)
    ? React.cloneElement(link.icon as React.ReactElement<{ className?: string }>, {
        className: cn(
          (link.icon as React.ReactElement<{ className?: string }>).props.className,
          !open && "!text-white"
        ),
      })
    : link.icon;

  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar rounded-md hover:bg-gray-2000/50 transition-colors",
        open ? "py-2 px-2" : "w-[28px] h-[28px] items-center justify-center p-0",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {iconWithConditionalColor}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-foreground text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0 font-sans"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

export const SidebarToggle = ({
  className,
  showDivider = true,
}: {
  className?: string;
  showDivider?: boolean;
}) => {
  const { open, setOpen, animate } = useSidebar();
  
  return (
    <>
      {showDivider && <div className="my-2 border-t border-gray-2000"></div>}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-start gap-2 group/sidebar rounded-md hover:bg-gray-2000/50 transition-colors",
          open ? "py-2 px-2 w-full" : "w-[28px] h-[28px] items-center justify-center p-0",
          className
        )}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
      >
        {open ? (
          <PanelLeftClose className="text-[#5A6063] h-5 w-5 flex-shrink-0" />
        ) : (
          <PanelLeftOpen className="text-[#5A6063] h-5 w-5 flex-shrink-0" />
        )}
      </button>
    </>
  );
};

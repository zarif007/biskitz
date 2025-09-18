"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun, Laptop, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import logo from "../../public/logo.png";
import { SignInDialog } from "@/components/auth/SignInDialog";
import { useSession, signOut } from "next-auth/react";

const navLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "Career", href: "/career" },
];

export function Header() {
  const { setTheme, resolvedTheme } = useTheme();
  const [showSignIn, setShowSignIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 w-full transition-all duration-200 mb-4",
        scrolled ? "bg-transparent/80 backdrop-blur" : "bg-transparent"
      )}
    >
      <SignInDialog open={showSignIn} onOpenChange={setShowSignIn} />
      <div className="max-w-7xl mx-auto flex h-12 md:h-16 items-center justify-between px-4 bg-transparent mt-1">
        {/* Left section */}
        <div className="flex items-center gap-4 border rounded-sm px-4 py-1 bg-background">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image src={logo} alt="Logo" width={24} height={24} />
          </Link>

          {/* Nav links for medium+ devices */}
          <div className="hidden md:flex gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-semibold text-sm px-2 py-1 hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {resolvedTheme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : resolvedTheme === "light" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Laptop className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Laptop className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hamburger menu for small devices */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {navLinks.map((item) => (
                  <DropdownMenuItem key={item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 border rounded-sm px-4 py-1 bg-background">
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {session.user.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  )}
                  {session.user.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSignIn(true)}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}


'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Bot, Menu, Code, Shield, LayoutDashboard } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UserNav } from './user-nav';

const navLinks = [
    {
        href: '/platform',
        label: 'Platform',
        icon: <LayoutDashboard />
    }
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Code className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block font-headline">
              CodeAssist
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'transition-colors hover:text-foreground/80 flex items-center gap-1',
                  pathname?.startsWith(link.href)
                    ? 'text-foreground'
                    : 'text-foreground/60'
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="md:hidden">
             <Link href="/" className="flex items-center space-x-2">
                  <Code className="h-6 w-6 text-primary" />
                  <span className="font-bold font-headline">CodeAssist</span>
                </Link>
          </div>
          <UserNav />
        </div>
      </div>
    </header>
  );
}

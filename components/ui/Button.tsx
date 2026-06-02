import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode };

type ButtonLinkProps = { href: string; children: ReactNode; className?: string };

export function buttonClasses(className = "") {
  return `inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-300 to-yellow-600 px-6 py-3 text-sm font-bold text-black shadow-glow transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 ${className}`;
}

export function Button({ children, className, ...props }: ButtonProps) {
  return (
    <button className={buttonClasses(className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({ href, children, className }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(className)} href={href}>
      {children}
    </Link>
  );
}

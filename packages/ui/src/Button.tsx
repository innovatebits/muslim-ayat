import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function Button({ children, className = "", variant = "primary", ...props }: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? "bg-[#123d32] text-white hover:bg-[#1c5547]"
      : "border border-[#dfe5da] bg-white text-[#123d32] hover:bg-[#edf0e7]";

  return (
    <button
      className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

// Combine standard button props with motion props, stripping conflicting types if necessary
type CombinedProps = ButtonProps & Omit<HTMLMotionProps<"button">, "ref">;

const Button = React.forwardRef<HTMLButtonElement, CombinedProps>(
    (
        {
            className,
            variant = "primary",
            size = "md",
            isLoading = false,
            leftIcon,
            rightIcon,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        const variants = {
            primary: "bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20 border-transparent",
            secondary: "bg-surface text-text-main hover:text-primary hover:bg-gray-50 border-border shadow-sm",
            outline: "bg-transparent border-gray-300 text-text-main hover:border-primary hover:text-primary",
            ghost: "bg-transparent text-text-muted hover:text-text-main hover:bg-gray-100/50 border-transparent",
            danger: "bg-red-50 text-red-600 hover:bg-red-100 border-transparent",
        };

        const sizes = {
            sm: "h-8 px-3 text-sm",
            md: "h-10 px-5 text-sm",
            lg: "h-12 px-8 text-base",
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
                whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:pointer-events-none border",
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : leftIcon ? (
                    <span className="mr-2 inline-flex shrink-0">{leftIcon}</span>
                ) : null}

                {children}

                {!isLoading && rightIcon && (
                    <span className="ml-2 inline-flex shrink-0">{rightIcon}</span>
                )}
            </motion.button>
        );
    }
);

Button.displayName = "Button";

export { Button };

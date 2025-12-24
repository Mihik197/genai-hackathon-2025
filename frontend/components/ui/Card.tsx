import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const Card = forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        noPadding?: boolean;
        hoverEffect?: boolean;
    }
>(({ className, children, noPadding = false, hoverEffect = false, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "bg-surface rounded-xl border border-border/50 text-text-main",
                "shadow-stripe transition-all duration-300 ease-out",
                hoverEffect && "hover:shadow-lg hover:-translate-y-1 hover:border-primary/20",
                !noPadding && "p-6",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
});

Card.displayName = "Card";

export { Card };

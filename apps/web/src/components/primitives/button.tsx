'use client';


import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg border border-transparent text-sm font-semibold transition-[background-color,color,border-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-primary/35',
        secondary:
          'border-border bg-secondary/70 text-secondary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-secondary',
        ghost: 'text-foreground hover:bg-muted/70'
      },
      size: {
        md: 'h-10 px-4',
        lg: 'h-11 px-6'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  children: ReactNode;
}

export const Button = ({
  asChild = false,
  className,
  size,
  variant,
  children,
  ...props
}: ButtonProps): React.JSX.Element => {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp className={cn(buttonVariants({ size, variant }), className)} {...props}>
      {children}
    </Comp>
  );
};


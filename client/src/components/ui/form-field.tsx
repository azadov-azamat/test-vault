"use client";
import * as React from "react";
import { useField } from "formik";
import { Input, InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps extends Omit<InputProps, "name"> {
  name: string;
  label?: string;
  description?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ name, label, description, className, ...props }, ref) => {
    const [field, meta] = useField(name);
    const showError = meta.touched && !!meta.error;
    return (
      <div className="space-y-1.5">
        {label && <Label htmlFor={name}>{label}</Label>}
        <Input
          id={name}
          ref={ref}
          {...field}
          {...props}
          aria-invalid={showError || undefined}
          className={cn(showError && "border-destructive focus-visible:ring-destructive", className)}
        />
        {description && !showError && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {showError && <p className="text-xs text-destructive">{meta.error}</p>}
      </div>
    );
  }
);
FormField.displayName = "FormField";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = "", ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-warm-gray ml-1">
          {label}
        </label>
      )}
      <input
        className={`bg-white rounded-xl border border-cream-darker px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-warm-dark placeholder:text-warm-gray/40 w-full ${className}`}
        {...props}
      />
    </div>
  );
};

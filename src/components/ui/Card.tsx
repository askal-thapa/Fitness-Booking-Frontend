import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  onClick,
  selected = false,
  hover = true,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl p-6 shadow-sm border transition-all duration-300
        ${onClick ? "cursor-pointer" : ""}
        ${selected ? "border-primary ring-2 ring-primary/20" : "border-cream-darker"}
        ${hover && !selected ? "hover:border-primary-light/40 hover:shadow-md" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

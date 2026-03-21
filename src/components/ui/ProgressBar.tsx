import React from "react";

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = "" }) => {
  return (
    <div className={`w-full bg-cream-darker rounded-full h-1.5 overflow-hidden ${className}`}>
      <div
        className="bg-primary h-full transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

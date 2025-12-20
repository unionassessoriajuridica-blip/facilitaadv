import * as React from "react";
import { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  iconColor?: string;
}

const FeatureCard = ({ icon, title, iconColor = "text-warning" }: FeatureCardProps) => {
  return (
    <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow">
      <div className={`text-2xl ${iconColor}`}>
        {icon}
      </div>
      <span className="text-sm font-medium text-foreground">{title}</span>
    </div>
  );
};

export default FeatureCard;
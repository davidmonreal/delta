import type { LucideIcon } from "lucide-react";
import { Minus, Pencil, Plus } from "lucide-react";

interface IconButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  title: string;
  variant?: "primary" | "danger" | "neutral";
  size?: "sm" | "md";
  className?: string;
}

const ICON_SIZES = {
  sm: 16,
  md: 20,
} as const;

const VARIANT_STYLES = {
  primary: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700",
  danger: "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700",
  neutral: "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800",
} as const;

export const IconButton = ({
  icon: Icon,
  onClick,
  title,
  variant = "neutral",
  size = "md",
  className = "",
}: IconButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg p-2 transition-colors ${VARIANT_STYLES[variant]} ${className}`}
      title={title}
    >
      <Icon size={ICON_SIZES[size]} />
    </button>
  );
};

interface SimpleIconButtonProps {
  onClick: () => void;
  title?: string;
  size?: "sm" | "md";
  className?: string;
}

export const AddIconButton = ({
  onClick,
  title = "Add",
  size = "md",
  className = "",
}: SimpleIconButtonProps) => {
  return (
    <IconButton
      icon={Plus}
      onClick={onClick}
      title={title}
      variant="primary"
      size={size}
      className={className}
    />
  );
};

export const RemoveIconButton = ({
  onClick,
  title = "Remove",
  size = "md",
  className = "",
}: SimpleIconButtonProps) => {
  return (
    <IconButton
      icon={Minus}
      onClick={onClick}
      title={title}
      variant="danger"
      size={size}
      className={className}
    />
  );
};

export const EditIconButton = ({
  onClick,
  title = "Edit",
  size = "sm",
  className = "",
}: SimpleIconButtonProps) => {
  return (
    <IconButton
      icon={Pencil}
      onClick={onClick}
      title={title}
      variant="primary"
      size={size}
      className={className}
    />
  );
};

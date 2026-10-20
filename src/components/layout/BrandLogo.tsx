import { useBranding } from "@/contexts/BrandingContext";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
}

// Logo da plataforma; sem logo configurada, mostra o ícone padrão.
export function BrandLogo({ className }: BrandLogoProps) {
  const { branding } = useBranding();

  if (branding.logo) {
    return (
      <img
        src={branding.logo}
        alt={branding.nomePlataforma}
        className={cn("object-contain", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-primary text-primary-foreground",
        className
      )}
    >
      🥗
    </div>
  );
}

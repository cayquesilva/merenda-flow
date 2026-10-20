import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  Branding,
  BRANDING_PADRAO,
  aplicarBranding,
  lerBrandingCache,
  salvarBrandingCache,
} from "@/lib/branding";
import { apiService } from "@/services/api";

interface BrandingContextType {
  branding: Branding;
  // Atualiza a marca na tela imediatamente (após salvar em Configurações).
  setBranding: (branding: Branding) => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  // O cache evita que a marca padrão apareça por um instante antes da API responder.
  const [branding, setBrandingState] = useState<Branding>(
    () => lerBrandingCache() ?? BRANDING_PADRAO
  );

  const setBranding = useCallback((novo: Branding) => {
    setBrandingState(novo);
    salvarBrandingCache(novo);
  }, []);

  useEffect(() => {
    aplicarBranding(branding);
  }, [branding]);

  useEffect(() => {
    apiService
      .getBranding()
      .then((dados) => setBranding({ ...BRANDING_PADRAO, ...dados }))
      .catch(() => {
        // sem resposta da API: segue com o cache ou a marca padrão
      });
  }, [setBranding]);

  return (
    <BrandingContext.Provider value={{ branding, setBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}

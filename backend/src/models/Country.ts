// src/models/Country.ts

export interface Country {
  id: number;
  code: string;  // AR, MX, CO
  name: string;  // Argentina, México, Colombia
  isActive: boolean;
}

// Países soportados inicialmente
export const SUPPORTED_COUNTRIES = [
  { code: 'AR', name: 'Argentina' },
  { code: 'MX', name: 'México' },
  { code: 'CO', name: 'Colombia' },
] as const;
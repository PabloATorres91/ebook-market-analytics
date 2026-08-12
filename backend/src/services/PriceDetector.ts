// backend/src/services/PriceDetector.ts

export class PriceDetector {
  private patterns = {
    // Precios con moneda específica
    ARS: /\$(\d{1,3}(?:\.\d{3})*)\s*(?:ARS|pesos?|argentinos?)/i,
    USD: /\$(\d{1,3}(?:\.\d{3})*)\s*(?:USD|dólares?|usd)/i,
    BRL: /R\$(\d{1,3}(?:\.\d{3})*)\s*(?:BRL|reales?|R\$)/i,
    // Precio genérico (ej: "$10.000" o "$ 10.000")
    generic: /\$\s*(\d{1,3}(?:\.\d{3})*)\b/,
    // Precio con punto decimal (ej: "10.99")
    decimal: /\$\s*(\d{1,3}(?:\.\d{3})*)\s*\.\s*(\d{2})/
  };

  detectPrice(text: string): { currency: string; amount: number | null } {
    if (!text) return { currency: 'UNKNOWN', amount: null };

    // Buscar ARS
    let match = text.match(this.patterns.ARS);
    if (match) {
      const amount = this.extractAmount(match);
      if (amount) return { currency: 'ARS', amount };
    }

    // Buscar USD
    match = text.match(this.patterns.USD);
    if (match) {
      const amount = this.extractAmount(match);
      if (amount) return { currency: 'USD', amount };
    }

    // Buscar BRL
    match = text.match(this.patterns.BRL);
    if (match) {
      const amount = this.extractAmount(match);
      if (amount) return { currency: 'BRL', amount };
    }

    // Buscar genérico (sin moneda)
    match = text.match(this.patterns.generic);
    if (match) {
      const amount = this.extractAmount(match);
      if (amount) return { currency: 'UNKNOWN', amount };
    }

    return { currency: 'UNKNOWN', amount: null };
  }

  private extractAmount(match: RegExpMatchArray): number | null {
    if (!match || !match[1]) return null;
    const amount = parseInt(match[1].replace(/\./g, ''));
    return isNaN(amount) ? null : amount;
  }

  toUSD(amount: number, currency: string): number {
    const rates: Record<string, number> = {
      ARS: 0.001,
      BRL: 0.18,
      USD: 1,
      UNKNOWN: 1
    };
    return Math.round(amount * (rates[currency] || 1) * 100) / 100;
  }
}
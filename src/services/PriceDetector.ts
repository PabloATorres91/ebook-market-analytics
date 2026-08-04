// src/services/PriceDetector.ts

export class PriceDetector {
  private patterns = {
    ARS: /\$(\d{1,3}(?:\.\d{3})*)\s*(?:ARS|pesos?|argentinos?)/i,
    USD: /\$(\d{1,3}(?:\.\d{3})*)\s*(?:USD|dólares?|usd)/i,
    BRL: /R\$(\d{1,3}(?:\.\d{3})*)\s*(?:BRL|reales?|R\$)/i,
    generic: /\$(\d{1,3}(?:\.\d{3})*)\b/
  };

  private extractAmount(match: RegExpMatchArray | null): number | null {
    if (!match || !match[1]) {
      return null;
    }
    const amount = parseInt(match[1].replace(/\./g, ''));
    return isNaN(amount) ? null : amount;
  }

  detectPrice(text: string): { currency: string; amount: number | null } {
    // Buscar primero en ARS
    let match = text.match(this.patterns.ARS);
    if (match) {
      const amount = this.extractAmount(match);
      if (amount !== null) {
        return { currency: 'ARS', amount };
      }
    }

    // Buscar en USD
    match = text.match(this.patterns.USD);
    if (match) {
      const amount = this.extractAmount(match);
      if (amount !== null) {
        return { currency: 'USD', amount };
      }
    }

    // Buscar en BRL
    match = text.match(this.patterns.BRL);
    if (match) {
      const amount = this.extractAmount(match);
      if (amount !== null) {
        return { currency: 'BRL', amount };
      }
    }

    // Buscar genérico
    match = text.match(this.patterns.generic);
    if (match) {
      const amount = this.extractAmount(match);
      if (amount !== null) {
        return { currency: 'UNKNOWN', amount };
      }
    }

    return { currency: 'UNKNOWN', amount: null };
  }

  // Convertir a USD (valores aproximados)
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
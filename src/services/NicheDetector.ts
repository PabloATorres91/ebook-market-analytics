// src/services/NicheDetector.ts

export class NicheDetector {
  private niches: Record<string, string[]> = {
    'Fitness': ['entrenamiento', 'ejercicio', 'gimnasio', 'fitness', 'musculación', 'yoga', 'pesas', 'cardio', 'salud'],
    'Finanzas': ['inversión', 'ahorro', 'finanzas', 'cripto', 'bitcoin', 'dólar', 'pesos', 'rentabilidad', 'negocio'],
    'Educación': ['aprender', 'curso', 'clase', 'educación', 'estudiar', 'lectura', 'idioma', 'inglés', 'universidad'],
    'Cocina': ['receta', 'cocina', 'comida', 'postre', 'gluten', 'dulce', 'nutrición', 'dieta', 'libro de cocina'],
    'Marketing': ['marketing', 'ventas', 'embudo', 'tráfico', 'conversión', 'publicidad', 'cliente', 'strategia'],
    'Desarrollo Personal': ['motivación', 'mente', 'habito', 'productividad', 'éxito', 'meditación', 'confianza']
  };

  detectNiche(text: string): string[] {
    const found: string[] = [];
    const lowerText = text.toLowerCase();

    for (const [niche, keywords] of Object.entries(this.niches)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          found.push(niche);
          break;
        }
      }
    }

    return found.length > 0 ? found : ['General'];
  }
}
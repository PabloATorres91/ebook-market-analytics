// backend/src/services/NicheDetector.ts

export class NicheDetector {
  private niches: Record<string, string[]> = {
    'Fitness': ['entrenamiento', 'ejercicio', 'gimnasio', 'fitness', 'musculación', 'yoga', 'pesas', 'cardio', 'salud', 'deporte'],
    'Finanzas': ['inversión', 'ahorro', 'finanzas', 'cripto', 'bitcoin', 'dólar', 'pesos', 'rentabilidad', 'negocio', 'bolsa'],
    'Educación': ['aprender', 'curso', 'clase', 'educación', 'estudiar', 'lectura', 'idioma', 'inglés', 'universidad', 'libro'],
    'Cocina': ['receta', 'cocina', 'comida', 'postre', 'gluten', 'dulce', 'nutrición', 'dieta', 'libro de cocina', 'recetas'],
    'Marketing': ['marketing', 'ventas', 'embudo', 'tráfico', 'conversión', 'publicidad', 'cliente', 'estrategia', 'negocio digital'],
    'Desarrollo Personal': ['motivación', 'mente', 'hábito', 'productividad', 'éxito', 'meditación', 'confianza', 'mentalidad']
  };

  detectNiche(text: string): string[] {
    if (!text) return ['General'];
    
    const found: string[] = [];
    const lowerText = text.toLowerCase();

    for (const [niche, keywords] of Object.entries(this.niches)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          found.push(niche);
          break;
        }
      }
    }

    return found.length > 0 ? found : ['General'];
  }
}
// src/services/AnalyticsService.ts

import { AdRepository } from './AdRepository.js';
import type { Ad } from '../models/Ad.js';

export class AnalyticsService {
  private repository: AdRepository;

  constructor() {
    this.repository = new AdRepository();
  }

  // Comparar un producto en múltiples países
  async compareCountries(keyword: string, countries: string[]): Promise<any> {
    const results: any = {};

    for (const country of countries) {
      const ads = await this.repository.searchAds({ keyword, country });
      const daysActive = ads.map(ad => {
        return Math.floor((Date.now() - new Date(ad.start_time).getTime()) / (1000 * 60 * 60 * 24));
      });

      const total = ads.length;
      const avgDays = daysActive.reduce((a, b) => a + b, 0) / (total || 1);
      const maxDays = Math.max(...daysActive, 0);

      // Páginas más activas
      const pages = ads.reduce((acc: any, ad) => {
        acc[ad.page_name] = (acc[ad.page_name] || 0) + 1;
        return acc;
      }, {});

      const topPages = Object.entries(pages)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 5)
        .map(([page, count]) => ({ page, count }));

      results[country] = {
        totalAds: total,
        averageDaysActive: Math.round(avgDays),
        maxDaysActive: maxDays,
        trending: total > 5 && avgDays > 30,
        topPages
      };
    }

    return results;
  }

  // Evolución temporal de un producto en un país
  async getEvolution(keyword: string, country: string): Promise<any> {
    const ads = await this.repository.searchAds({ keyword, country });
    
    // Agrupar por semana de inicio
    const weeks: Record<string, Ad[]> = {};
    for (const ad of ads) {
      // Validar que la fecha exista
      if (!ad.start_time) {
        console.warn('Anuncio sin start_time:', ad.id);
        continue;
      }
      
      const week = new Date(ad.start_time);
      week.setHours(0, 0, 0, 0);
      const isoString = week.toISOString();
      const key = isoString.split('T')[0];
      
      // Validar que key no sea undefined ni vacío
      if (!key) {
        console.warn('No se pudo generar clave para:', ad.id);
        continue;
      }
      
      if (!weeks[key]) weeks[key] = [];
      weeks[key].push(ad);
    }

    // ✅ Corregido: validar que weeks[date] existe
    return Object.keys(weeks)
      .sort()
      .map(date => {
        const adsForDate = weeks[date];
        if (!adsForDate) {
          return {
            date,
            count: 0,
            ads: []
          };
        }
        return {
          date,
          count: adsForDate.length,
          ads: adsForDate
        };
      });
  }
}
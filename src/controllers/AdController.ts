// src/controllers/AdController.ts

import { AdRepository } from '../services/AdRepository.js';
import { MetaAdsService } from '../services/MetaAdsService.js';
import type { AdSearchParams } from '../models/Ad.js';

export class AdController {
  private repository: AdRepository;
  private metaService: MetaAdsService;

  constructor() {
    this.repository = new AdRepository();
    this.metaService = new MetaAdsService();
  }

  // Buscar anuncios
  async searchAds(params: AdSearchParams) {
    return await this.repository.searchAds(params);
  }

  // Obtener un anuncio por ID
  async getAdById(id: string) {
    return await this.repository.getAdById(id);
  }

  // Obtener tendencias
  async getTrends(country?: string) {
    return await this.repository.getTrends(country);
  }

  // Sincronizar anuncios de Meta
  async syncAds(keyword: string, country: string) {
    return await this.metaService.syncAds(keyword, country);
  }

  // Obtener estadísticas de país
  async getCountryStats(country: string) {
    const ads = await this.repository.searchAds({ country });
    const total = ads.length;
    const avgDaysActive = ads.reduce((acc, ad) => {
      const days = Math.floor((Date.now() - new Date(ad.start_time).getTime()) / (1000 * 60 * 60 * 24));
      return acc + days;
    }, 0) / (total || 1);

    return {
      country,
      totalAds: total,
      averageDaysActive: Math.round(avgDaysActive),
      trending: total > 10 && avgDaysActive > 30
    };
  }
}
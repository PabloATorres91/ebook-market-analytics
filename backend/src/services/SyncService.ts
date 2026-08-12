// src/services/SyncService.ts

import cron from 'node-cron';
import { MetaAdsService } from './MetaAdsService.js';
import { SUPPORTED_COUNTRIES } from '../models/Country.js';

export class SyncService {
  private metaService: MetaAdsService;

  constructor() {
    this.metaService = new MetaAdsService();
  }

  // Sincronizar todos los países con una palabra clave
  async syncAllCountries(
    keyword: string,
    minDays: number = 14,
    periodDays: number = 0
  ): Promise<void> {
    console.log(`🔄 Iniciando sincronización para "${keyword}" en todos los países...`);

    const results: any[] = [];

    for (const country of SUPPORTED_COUNTRIES) {
      try {
        // ✅ Pasar minDays y periodDays a syncAds
        const ads = await this.metaService.syncAds(keyword, country.code, minDays, periodDays);
        results.push({
          country: country.code,
          count: ads.length,
          success: true
        });
        console.log(`✅ ${ads.length} anuncios guardados para ${country.name}`);
      } catch (error) {
        console.error(`❌ Error al sincronizar ${country.name}:`, error);
        results.push({
          country: country.code,
          count: 0,
          success: false,
          error: String(error)
        });
      }
    }

    console.log('📊 Resumen de sincronización:', results);
  }

  // Iniciar el programador de tareas
  startScheduler(): void {
    // Cada hora
    cron.schedule('0 * * * *', async () => {
      console.log('⏰ Ejecutando sincronización programada...');
      await this.syncAllCountries('ebook');
      await this.syncAllCountries('libro digital');
      await this.syncAllCountries('marketing digital');
    });

    console.log('✅ Programador de sincronización iniciado (cada hora)');
  }

  // Sincronización manual desde la API
  async syncNow(
    keyword: string,
    country?: string,
    minDays: number = 14,
    periodDays: number = 0  // ✅ Valor por defecto 0 (todos los anuncios)
  ): Promise<void> {
    if (country) {
      const ads = await this.metaService.syncAds(keyword, country, minDays, periodDays);
      console.log(`✅ Sincronización manual completada: ${ads.length} anuncios`);
    } else {
      await this.syncAllCountries(keyword, minDays, periodDays);

    }
  }
}
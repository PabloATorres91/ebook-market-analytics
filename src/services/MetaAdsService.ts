// src/services/MetaAdsService.ts

import axios from 'axios';
import type { Ad, MetaAdResponse } from '../models/Ad.js';
import { AdRepository } from './AdRepository.js';

export class MetaAdsService {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly repository: AdRepository;

  constructor() {
    this.baseUrl = `https://graph.facebook.com/${process.env.META_API_VERSION || 'v25.0'}`;
    this.accessToken = process.env.META_ACCESS_TOKEN || '';
    this.repository = new AdRepository();
  }

  // Obtener anuncios de la API de Meta
  async fetchAds(keyword: string, country: string): Promise<MetaAdResponse[]> {
    if (!this.accessToken) {
      console.warn('⚠️ META_ACCESS_TOKEN no configurado. Usando datos mock.');
      return this.getMockAds(keyword, country);
    }

    const url = `${this.baseUrl}/ads_archive`;
    const params = {
      search_terms: keyword,
      ad_reached_countries: `['${country}']`,
      fields: 'id,page_name,ad_creative_bodies,ad_delivery_start_time,ad_snapshot_url,publisher_platforms',
      access_token: this.accessToken,
      limit: 50
    };

    try {
      const response = await axios.get(url, { params });
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Error al obtener anuncios de Meta:', error);
      return [];
    }
  }

  // Datos de prueba (mock) para cuando no hay token
  private getMockAds(keyword: string, country: string): MetaAdResponse[] {
    const now = new Date();
    const mockData = [
      {
        id: 'mock_1',
        page_name: 'Editorial Digital AR',
        ad_creative_bodies: [`Aprende a escribir ebooks en 30 días - Curso completo sobre ${keyword}`],
        ad_delivery_start_time: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        ad_snapshot_url: 'https://example.com/ad1',
        publisher_platforms: ['facebook', 'instagram']
      },
      {
        id: 'mock_2',
        page_name: 'Marketing Digital MX',
        ad_creative_bodies: [`Cómo vender ebooks en Latinoamérica - Guía definitiva sobre ${keyword}`],
        ad_delivery_start_time: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        ad_snapshot_url: 'https://example.com/ad2',
        publisher_platforms: ['facebook']
      },
      {
        id: 'mock_3',
        page_name: 'Editorial Digital AR',
        ad_creative_bodies: [`Pack de 10 ebooks de marketing digital sobre ${keyword}`],
        ad_delivery_start_time: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        ad_snapshot_url: 'https://example.com/ad3',
        publisher_platforms: ['instagram']
      }
    ];
    return mockData;
  }

  // Convertir respuesta de Meta a nuestro modelo
mapToAd(metaAd: MetaAdResponse, countryCode: string): Ad {
  return {
    id: metaAd.id,
    page_name: metaAd.page_name,
    body: metaAd.ad_creative_bodies?.join(' ') || '',
    snapshot_url: metaAd.ad_snapshot_url || '',
    start_time: new Date(metaAd.ad_delivery_start_time),
    publisher_platforms: metaAd.publisher_platforms || [], // ✅ Debe ser un array
    country_code: countryCode,
    first_seen: new Date(),
    last_seen: new Date()
  };
}

  // Sincronizar anuncios: obtener de Meta y guardar en DB
  async syncAds(keyword: string, country: string): Promise<Ad[]> {
    const metaAds = await this.fetchAds(keyword, country);

    if (metaAds.length === 0) {
      console.log(`⚠️ No se encontraron anuncios para "${keyword}" en ${country}`);
      return [];
    }

    const savedAds: Ad[] = [];
    for (const metaAd of metaAds) {
      const ad = this.mapToAd(metaAd, country);
      const saved = await this.repository.saveAd(ad);
      savedAds.push(saved);
    }

    console.log(`✅ Guardados ${savedAds.length} anuncios para "${keyword}" en ${country}`);
    return savedAds;
  }
}
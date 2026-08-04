// src/services/MetaAdsService.ts

import axios from 'axios';
import type { Ad, MetaAdResponse } from '../models/Ad.js';
import { AdRepository } from './AdRepository.js';

export class MetaAdsService {
  private readonly baseUrl: string;
  private readonly accessToken: string;

  constructor() {
    this.baseUrl = `https://graph.facebook.com/${process.env.META_API_VERSION || 'v25.0'}`;
    this.accessToken = process.env.META_ACCESS_TOKEN || '';
  }

  // Obtener anuncios de la API de Meta
  async fetchAds(keyword: string, country: string): Promise<MetaAdResponse[]> {
    if (!this.accessToken) {
      console.warn('⚠️  META_ACCESS_TOKEN no configurado. Usando datos mock.');
      return [];
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

  // Convertir respuesta de Meta a nuestro modelo
  mapToAd(metaAd: MetaAdResponse, countryCode: string): Ad {
    return {
      id: metaAd.id,
      page_name: metaAd.page_name,
      body: metaAd.ad_creative_bodies?.join(' ') || '',
      snapshot_url: metaAd.ad_snapshot_url || '',
      start_time: new Date(metaAd.ad_delivery_start_time),
      publisher_platforms: metaAd.publisher_platforms || [],
      country_code: countryCode,
      first_seen: new Date(),
      last_seen: new Date()
    };
  }

  // Sincronizar anuncios: obtener de Meta y guardar en DB
  async syncAds(keyword: string, country: string): Promise<Ad[]> {
    const repository = new AdRepository();
    const metaAds = await this.fetchAds(keyword, country);

    if (metaAds.length === 0) {
      console.log(`⚠️  No se encontraron anuncios para "${keyword}" en ${country}`);
      return [];
    }

    const savedAds: Ad[] = [];
    for (const metaAd of metaAds) {
      const ad = this.mapToAd(metaAd, country);
      const saved = await repository.saveAd(ad);
      savedAds.push(saved);
    }

    console.log(`✅ Guardados ${savedAds.length} anuncios para "${keyword}" en ${country}`);
    return savedAds;
  }
}
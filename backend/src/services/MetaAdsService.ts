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
  async fetchAds(
    keyword: string,
    country: string,
    minDays: number = 0,
    periodDays: number = 30 // ✅ Nuevo parámetro
  ): Promise<MetaAdResponse[]> {
    if (!this.accessToken) {
      console.warn('⚠️ META_ACCESS_TOKEN no configurado. Usando datos mock.');
      return this.getMockAds(keyword, country);
    }

    const url = `${this.baseUrl}/ads_archive`;

    // ✅ 1. Construir los parámetros base
    const params: any = {
      search_terms: keyword,
      ad_reached_countries: `['${country}']`,
      search_type: 'KEYWORD_EXACT_PHRASE',
      languages: '["es"]',
      ad_active_status: 'ACTIVE',
      fields: 'id,page_name,ad_creative_bodies,ad_delivery_start_time,ad_snapshot_url,publisher_platforms',
      access_token: this.accessToken,
      limit: '50',
      // ✅ ORDENAR POR FECHA DE INICIO (MÁS ANTIGUOS PRIMERO)
      sort_by: 'ad_delivery_start_time_asc'
    };

    // ✅ 2. Filtro por período de tiempo (si periodDays > 0)
    if (periodDays > 0) {
      const today = new Date();
      const minDate = new Date(today);
      minDate.setDate(today.getDate() - periodDays);

      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      params.ad_delivery_date_min = formatDate(minDate);
      params.ad_delivery_date_max = formatDate(today);
      
      console.log(`🔍 Filtrando anuncios activos entregados entre ${params.ad_delivery_date_min} y ${params.ad_delivery_date_max} (últimos ${periodDays} días)`);
    } else {
      // ✅ Si periodDays === 0, NO aplicar filtro de fechas
      console.log('🔍 Sin filtro de período temporal (todos los anuncios activos)');
    }

    // ✅ 3. Filtro por antigüedad mínima (minDays)
    if (minDays > 0) {
      const limitDate = new Date(Date.now() - minDays * 24 * 60 * 60 * 1000);
      params['ad_delivery_start_time[lte]'] = limitDate.toISOString();
      console.log(`🔍 Filtrando anuncios con más de ${minDays} días de antigüedad (inicio antes de ${limitDate.toISOString()})`);
    }

    try {
      console.log(`🔍 Consultando Meta: ${url}?${new URLSearchParams(params).toString()}`);
      const response = await axios.get(url, { params });
      console.log(`✅ Meta respondió con ${response.data.data?.length || 0} anuncios`);
      return response.data.data || [];
    } catch (error: any) {
      if (this.isTokenExpiredError(error)) {
        console.error('❌ TOKEN EXPIRADO...');
        throw new Error('TOKEN_EXPIRED');
      }
      console.error('❌ Error al obtener anuncios de Meta:', error);
      return [];
    }
  }


  // Verificar si el error es de token expirado
  private isTokenExpiredError(error: any): boolean {
    if (error.response?.data?.error) {
      const errorCode = error.response.data.error.code;
      const errorSubcode = error.response.data.error.error_subcode;
      // Códigos de error de token expirado
      return errorCode === 190 || errorSubcode === 463 || errorSubcode === 467;
    }
    return false;
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
  async syncAds(
    keyword: string,
    country: string,
    minDays: number = 0,
    periodDays: number = 0  // ✅ Valor por defecto 0 (todos los anuncios)
  ): Promise<Ad[]> {
    console.log(`📌 syncAds recibió minDays: ${minDays}, periodDays: ${periodDays}`);
    const metaAds = await this.fetchAds(keyword, country, minDays, periodDays);

    if (metaAds.length === 0) {
      console.log(`⚠️ No se encontraron anuncios para "${keyword}" en ${country}`);
      return [];
    }

    const savedAds: Ad[] = [];
    for (const metaAd of metaAds) {
      const ad = this.mapToAd(metaAd, country);

      // ✅ Filtro manual para asegurar antigüedad
      const daysActive = Math.floor((Date.now() - new Date(ad.start_time).getTime()) / (1000 * 60 * 60 * 24));

      // ✅ Solo guardar si cumple con la antigüedad mínima
      if (daysActive >= minDays) {
        const saved = await this.repository.saveAd(ad);
        savedAds.push(saved);
        console.log(`✅ Guardado anuncio ${ad.id} con ${daysActive} días activos`);
      } else {
        console.log(`⏭️ Anuncio ${ad.id} con ${daysActive} días activos (menos de ${minDays}) - NO guardado`);
      }
    }

    console.log(`✅ Guardados ${savedAds.length} anuncios para "${keyword}" en ${country}`);
    return savedAds;
  }
}
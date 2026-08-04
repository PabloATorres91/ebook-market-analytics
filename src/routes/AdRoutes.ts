// src/routes/adRoutes.ts

import type { FastifyInstance } from 'fastify';
import { AdController } from '../controllers/AdController.js';
import { SyncService } from '../services/SyncService.js';
import { AnalyticsService } from '../services/AnalyticsService.js';
import { PriceDetector } from '../services/PriceDetector.js';



export async function adRoutes(fastify: FastifyInstance) {
  const controller = new AdController();

  fastify.get('/api/ads/search', async (request, reply) => {
    try {
      const query = request.query as any;
      
      // Construir el objeto de búsqueda solo con las propiedades que existen
      const searchParams: any = {
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 20
      };

      // Solo agregar propiedades si tienen valor
      if (query.keyword) searchParams.keyword = query.keyword;
      if (query.country) searchParams.country = query.country;
      if (query.minDaysActive) searchParams.minDaysActive = parseInt(query.minDaysActive);
      if (query.maxDaysActive) searchParams.maxDaysActive = parseInt(query.maxDaysActive);
      
      const results = await controller.searchAds(searchParams);

      return reply.send({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      console.error('Error en búsqueda:', error);
      return reply.status(500).send({
        success: false,
        error: 'Error al buscar anuncios'
      });
    }
  });

  // Obtener anuncio por ID
fastify.get('/api/ads/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const ad = await controller.getAdById(id);
    
    if (!ad) {
      return reply.status(404).send({
        success: false,
        error: 'Anuncio no encontrado'
      });
    }

    // Detectar precio
    const priceDetector = new PriceDetector();
    const priceInfo = priceDetector.detectPrice(ad.body);

    // Calcular días activos
    const daysActive = Math.floor((Date.now() - new Date(ad.start_time).getTime()) / (1000 * 60 * 60 * 24));

    return reply.send({
      success: true,
      data: {
        ...ad,
        daysActive,
        price: {
          original: priceInfo.currency !== 'UNKNOWN' ? priceInfo.amount : null,
          currency: priceInfo.currency,
          usdEstimate: priceInfo.amount ? priceDetector.toUSD(priceInfo.amount, priceInfo.currency) : null
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener anuncio:', error);
    return reply.status(500).send({
      success: false,
      error: 'Error al obtener anuncio'
    });
  }
});

// Obtener tendencias con análisis
fastify.get('/api/ads/trends', async (request, reply) => {
  try {
    const { country, days = '30' } = request.query as { country?: string; days?: string };
    const minDays = parseInt(days);
    
    const trends = await controller.getTrends(country, minDays);
    
    // Calcular métricas adicionales
    const total = trends.length;
    const avgDays = trends.reduce((acc, ad) => {
      const daysActive = Math.floor((Date.now() - new Date(ad.start_time).getTime()) / (1000 * 60 * 60 * 24));
      return acc + daysActive;
    }, 0) / (total || 1);

    const topPages = trends.reduce((acc: any, ad) => {
      acc[ad.page_name] = (acc[ad.page_name] || 0) + 1;
      return acc;
    }, {});

    return reply.send({
      success: true,
      data: {
        trends,
        summary: {
          total,
          averageDaysActive: Math.round(avgDays),
          topPages: Object.entries(topPages)
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 5)
            .map(([page, count]) => ({ page, count }))
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener tendencias:', error);
    return reply.status(500).send({
      success: false,
      error: 'Error al obtener tendencias'
    });
  }
});

  // Estadísticas por país
  fastify.get('/api/ads/stats/:country', async (request, reply) => {
    try {
      const { country } = request.params as { country: string };
      const stats = await controller.getCountryStats(country);
      
      return reply.send({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return reply.status(500).send({
        success: false,
        error: 'Error al obtener estadísticas'
      });
    }
  });

    // Sincronizar manualmente
    fastify.post('/api/ads/sync', async (request, reply) => {
    try {
    const { keyword, country } = request.body as { keyword: string; country?: string };

    if (!keyword) {
        return reply.status(400).send({
        success: false,
        error: 'Falta el parámetro: keyword es obligatorio'
        });
    }

    const syncService = new SyncService();
    await syncService.syncNow(keyword, country);

    return reply.send({
        success: true,
        message: `Sincronización iniciada para "${keyword}"${country ? ` en ${country}` : ' en todos los países'}`
    });
    } catch (error) {
    console.error('Error en sincronización:', error);
    return reply.status(500).send({
        success: false,
        error: 'Error al sincronizar anuncios'
    });
    }
    });

    // Comparativa entre países
fastify.get('/api/ads/compare', async (request, reply) => {
  try {
    const { keyword, countries } = request.query as { keyword: string; countries: string };
    const countryList = countries ? countries.split(',') : ['AR', 'MX', 'CO'];
    
    const analytics = new AnalyticsService();
    const results = await analytics.compareCountries(keyword, countryList);
    
    return reply.send({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error en comparativa:', error);
    return reply.status(500).send({
      success: false,
      error: 'Error al comparar países'
    });
  }
});

// Evolución temporal
fastify.get('/api/ads/evolution', async (request, reply) => {
  try {
    const { keyword, country } = request.query as { keyword: string; country: string };
    
    if (!keyword || !country) {
      return reply.status(400).send({
        success: false,
        error: 'Faltan parámetros: keyword y country son obligatorios'
      });
    }
    
    const analytics = new AnalyticsService();
    const results = await analytics.getEvolution(keyword, country);
    
    return reply.send({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error en evolución:', error);
    return reply.status(500).send({
      success: false,
      error: 'Error al obtener evolución'
    });
  }
});
}
// src/routes/adRoutes.ts

import type { FastifyInstance } from 'fastify';
import { AdController } from '../controllers/AdController.js';

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

      return reply.send({
        success: true,
        data: ad
      });
    } catch (error) {
      console.error('Error al obtener anuncio:', error);
      return reply.status(500).send({
        success: false,
        error: 'Error al obtener anuncio'
      });
    }
  });

  // Obtener tendencias
  fastify.get('/api/ads/trends', async (request, reply) => {
    try {
      const { country } = request.query as { country?: string };
      const trends = await controller.getTrends(country);
      
      return reply.send({
        success: true,
        data: trends,
        count: trends.length
      });
    } catch (error) {
      console.error('Error al obtener tendencias:', error);
      return reply.status(500).send({
        success: false,
        error: 'Error al obtener tendencias'
      });
    }
  });

  // Sincronizar anuncios de Meta
  fastify.post('/api/ads/sync', async (request, reply) => {
    try {
      const { keyword, country } = request.body as { keyword: string; country: string };
      
      if (!keyword || !country) {
        return reply.status(400).send({
          success: false,
          error: 'Faltan parámetros: keyword y country son obligatorios'
        });
      }

      const results = await controller.syncAds(keyword, country);
      
      return reply.send({
        success: true,
        data: results,
        count: results.length,
        message: `Sincronizados ${results.length} anuncios para "${keyword}" en ${country}`
      });
    } catch (error) {
      console.error('Error al sincronizar:', error);
      return reply.status(500).send({
        success: false,
        error: 'Error al sincronizar anuncios'
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
}
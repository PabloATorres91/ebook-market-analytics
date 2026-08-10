// src/services/AdRepository.ts

import pool from '../config/database.js';
import type { Ad, AdSearchParams } from '../models/Ad.js';

export class AdRepository {
  // Guardar un anuncio (o actualizar si ya existe)
async saveAd(ad: Omit<Ad, 'first_seen' | 'last_seen'>): Promise<Ad> {
  const query = `
    INSERT INTO ads (
      id, page_name, body, snapshot_url, start_time, 
      publisher_platforms, country_code, first_seen, last_seen
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      page_name = EXCLUDED.page_name,
      body = EXCLUDED.body,
      snapshot_url = EXCLUDED.snapshot_url,
      last_seen = NOW()
    RETURNING *;
  `;

  const values = [
    ad.id,
    ad.page_name,
    ad.body,
    ad.snapshot_url,
    ad.start_time,
    JSON.stringify(ad.publisher_platforms), // ✅ Convertir a JSON
    ad.country_code
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

  // Buscar anuncios con filtros
  async searchAds(params: AdSearchParams): Promise<Ad[]> {
    let query = `
      SELECT 
        a.*,
        c.name as country_name
      FROM ads a
      JOIN countries c ON a.country_code = c.code
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramIndex = 1;

    if (params.keyword) {
      query += ` AND (a.page_name ILIKE $${paramIndex} OR a.body ILIKE $${paramIndex})`;
      values.push(`%${params.keyword}%`);
      paramIndex++;
    }

    if (params.country) {
      query += ` AND a.country_code = $${paramIndex}`;
      values.push(params.country);
      paramIndex++;
    }

    if (params.minDaysActive) {
      query += ` AND EXTRACT(DAY FROM (NOW() - a.start_time)) >= $${paramIndex}`;
      values.push(params.minDaysActive);
      paramIndex++;
    }

    if (params.maxDaysActive) {
      query += ` AND EXTRACT(DAY FROM (NOW() - a.start_time)) <= $${paramIndex}`;
      values.push(params.maxDaysActive);
      paramIndex++;
    }

    query += ` ORDER BY a.start_time DESC`;

    if (params.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(params.limit);
      paramIndex++;
    }

    if (params.page && params.limit) {
      const offset = (params.page - 1) * params.limit;
      query += ` OFFSET $${paramIndex}`;
      values.push(offset);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Obtener un anuncio por ID
  async getAdById(id: string): Promise<Ad | null> {
    const query = `
      SELECT 
        a.*,
        c.name as country_name
      FROM ads a
      JOIN countries c ON a.country_code = c.code
      WHERE a.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Obtener tendencias (anuncios más activos)
async getTrends(country?: string, minDays: number = 30): Promise<Ad[]> {
  let query = `
    SELECT 
      a.*,
      c.name as country_name,
      EXTRACT(DAY FROM (NOW() - a.start_time)) as days_active
    FROM ads a
    JOIN countries c ON a.country_code = c.code
    WHERE EXTRACT(DAY FROM (NOW() - a.start_time)) > $1
  `;

  const values: any[] = [minDays];
  let paramIndex = 2;

  if (country) {
    query += ` AND a.country_code = $${paramIndex}`;
    values.push(country);
    paramIndex++;
  }

  query += ` ORDER BY days_active DESC LIMIT 20`;

  const result = await pool.query(query, values);
  return result.rows;
}
}
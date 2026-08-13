// src/models/Ad.ts

export interface Ad {
  id: string;
  page_name: string;
  body: string;
  snapshot_url: string;
  start_time: Date;
  publisher_platforms: string[];
  country_code: string;
  first_seen: Date;
  last_seen: Date;
  ad_creation_time?: Date; // ✅ Nuevo campo
}

export interface MetaAdResponse {
  id: string;
  page_name: string;
  ad_creative_bodies: string[];
  ad_delivery_start_time: string;
  ad_snapshot_url: string;
  publisher_platforms: string[];
  ad_creation_time?: string; // ✅ Nuevo campo
}

export interface AdSearchParams {
  keyword?: string;
  country?: string;
  minDaysActive?: number;  // ✅ opcional
  maxDaysActive?: number;  // ✅ opcional
  page?: number;
  limit?: number;
}
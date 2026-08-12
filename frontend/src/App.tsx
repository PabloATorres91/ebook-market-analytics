import { useState, useEffect } from 'react';
import { apiClient } from './api/client';

interface Ad {
  id: string;
  page_name: string;
  body: string;
  snapshot_url: string;
  start_time: string;
  country_code: string;
  first_seen: string;
  last_seen: string;
  price?: {
    original: number | null;
    currency: string;
    usdEstimate: number | null;
  };
  niches?: string[];
}

function App() {
  const [keyword, setKeyword] = useState('ebook');
  const [country, setCountry] = useState('AR');
  const [minDays, setMinDays] = useState(14);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [noResultsMessage, setNoResultsMessage] = useState('');
  const [periodDays, setPeriodDays] = useState(30);


  const getTrendLabel = (days: number) => {
    if (days >= 30) return { label: '🟢 Tendencia Alta', color: 'bg-green-100 text-green-800' };
    if (days >= 14) return { label: '🟡 Tendencia Media', color: 'bg-yellow-100 text-yellow-800' };
    return { label: '🔴 Tendencia Baja', color: 'bg-red-100 text-red-800' };
  };

  // ✅ Función UNIFICADA: Buscar en Meta (sincroniza y muestra los datos guardados)
  const searchInMeta = async () => {
    setLoading(true);
    setSelectedAd(null);
    setAds([]);
    setNoResultsMessage('');

    try {
      console.log(`🔍 Buscando "${keyword}" en Meta...`);

      // 1. Sincronizar con Meta (guarda los anuncios en la BD)
      const syncResponse = await apiClient.post('/api/ads/sync', {
        keyword,
        country,
        minDays: minDays > 0 ? minDays : undefined,
        periodDays: periodDays // ✅ Nuevo parámetro
      });

      if (!syncResponse.data.success) {
        alert('Error al sincronizar con Meta. Verifica tu token.');
        setLoading(false);
        return;
      }

      // 2. Obtener los anuncios guardados SIN filtrar por palabra clave
      //    Solo filtramos por país y días mínimos
      const searchResponse = await apiClient.get('/api/ads/search', {
        params: {
          country,
          limit: 50,
          minDaysActive: minDays > 0 ? minDays : undefined
        },
      });

      // ✅ IMPORTANTE: No filtramos por keyword, solo mostramos los guardados
      const uniqueData = searchResponse.data.data.filter((ad: Ad, index: number, self: Ad[]) =>
        index === self.findIndex((a) => a.id === ad.id)
      );

      setAds(uniqueData);

      if (uniqueData.length === 0 && minDays > 0) {
        setNoResultsMessage(`No se encontraron anuncios con ${minDays} días o más. Probá reduciendo el filtro de días.`);
      }

      if (uniqueData.length > 0) {
        fetchAdDetails(uniqueData[0].id);
      }

      console.log(`✅ Mostrando ${uniqueData.length} anuncios para "${keyword}"`);

    } catch (error) {
      console.error('Error en búsqueda en Meta:', error);
      alert('Error al buscar en Meta. Verifica que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda en la Base de Datos (con filtro de palabra clave)
  const searchInBD = async () => {
    setLoading(true);
    setSelectedAd(null);
    setNoResultsMessage('');

    try {
      const response = await apiClient.get('/api/ads/search', {
        params: {
          keyword,
          country,
          limit: 30,
          minDaysActive: minDays > 0 ? minDays : undefined
        },
      });

      const uniqueData = response.data.data.filter((ad: Ad, index: number, self: Ad[]) =>
        index === self.findIndex((a) => a.id === ad.id)
      );

      setAds(uniqueData);

      if (uniqueData.length === 0 && minDays > 0) {
        setNoResultsMessage(`No se encontraron anuncios con ${minDays} días o más en la BD. Probá sincronizando primero.`);
      }

      if (uniqueData.length > 0) fetchAdDetails(uniqueData[0].id);
    } catch (error) {
      console.error('Error buscando en BD:', error);
      alert('Error al buscar en la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda automática al cargar (en BD)
  useEffect(() => {
    searchInBD();
  }, []);

  const fetchAdDetails = async (id: string) => {
    try {
      const response = await apiClient.get(`/api/ads/${id}`);
      setSelectedAd(response.data.data);
    } catch (error) {
      console.error('Error al obtener detalle:', error);
    }
  };

  const getDaysActive = (startTime: string) => {
    if (!startTime) return 0;
    const days = Math.floor((Date.now() - new Date(startTime).getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const getDaysColor = (days: number) => {
    if (days === 0) return 'bg-gray-200 text-gray-600';
    if (days < 7) return 'bg-yellow-100 text-yellow-800';
    if (days < 30) return 'bg-orange-100 text-orange-800';
    if (days < 60) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">📈 Ebook Market Analytics</h1>

        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap gap-4 mb-2 text-xs text-gray-500">
            <span>🔍 <span className="font-medium">Palabra clave:</span> El tema que quieres investigar (ej: nutrición, finanzas).</span>
            <span>🌍 <span className="font-medium">País:</span> Mercado que quieres analizar.</span>
            <span>📅 <span className="font-medium">Antigüedad mínima:</span> Solo anuncios con más de X días activos.</span>
            <span>📅 <span className="font-medium">Período de búsqueda:</span> Anuncios activos en el período seleccionado (o "Todos los anuncios" sin límite de fechas).</span>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Palabra clave (ej: ebook, finanzas, recetas)..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1 min-w-[200px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="AR">🇦🇷 Argentina</option>
              <option value="MX">🇲🇽 México</option>
              <option value="CO">🇨🇴 Colombia</option>
              <option value="CL">🇨🇱 Chile</option>
              <option value="PE">🇵🇪 Perú</option>
            </select>
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">📅 Todos los anuncios</option>
              <option value="7">Últimos 7 días</option>
              <option value="14">Últimos 14 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="45">Últimos 45 días</option>
              <option value="60">Últimos 60 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="180">Últimos 180 días</option>
              <option value="365">Último año</option>
            </select>
            <input
              type="number"
              placeholder="Antigüedad mínima (en días)"
              value={minDays}
              onChange={(e) => setMinDays(Number(e.target.value))}
              className="w-28 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={searchInMeta}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
            >
              {loading ? 'Buscando en Meta...' : '🌐 Buscar en Meta'}
            </button>
            <button
              onClick={searchInBD}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? 'Buscando en BD...' : '📂 Buscar en BD'}
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <span className="bg-green-100 px-2 py-0.5 rounded">🌐 En Vivo</span> = Datos frescos de Meta.
            <span className="bg-blue-100 px-2 py-0.5 rounded ml-2">📂 BD</span> = Datos guardados (más rápido).
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Lista de Anuncios */}
          <div className="md:w-2/5 bg-white rounded-lg shadow-md p-4 max-h-[75vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3 sticky top-0 bg-white py-2 border-b border-gray-200">
              <h2 className="font-semibold text-gray-700">📋 Resultados</h2>
              <span className="text-sm bg-gray-100 px-2 py-1 rounded">{ads.length} anuncios</span>
            </div>

            {ads.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-200 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-gray-500">🟢 Alta</span>
                  <p className="font-bold text-green-700">{ads.filter(ad => getDaysActive(ad.start_time) >= 30).length}</p>
                </div>
                <div>
                  <span className="text-gray-500">🟡 Media</span>
                  <p className="font-bold text-yellow-700">{ads.filter(ad => getDaysActive(ad.start_time) >= 14 && getDaysActive(ad.start_time) < 30).length}</p>
                </div>
                <div>
                  <span className="text-gray-500">🔴 Baja</span>
                  <p className="font-bold text-red-700">{ads.filter(ad => getDaysActive(ad.start_time) < 14).length}</p>
                </div>
              </div>
            )}

            {loading ? (
              <p className="text-center text-gray-500 py-8">Cargando anuncios...</p>
            ) : ads.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">      No se encontraron anuncios con {minDays} días o más de antigüedad.</p>
                {noResultsMessage && (
                  <p className="text-xs text-gray-400 mt-2">
                    Sugerencia: Reducí la antigüedad mínima o sincronizá con Meta para traer anuncios nuevos.
                  </p>)}
              </div>
            ) : (
              <ul className="space-y-2">
                {ads.map((ad) => {
                  const daysActive = getDaysActive(ad.start_time);
                  const isSelected = selectedAd?.id === ad.id;
                  const trend = getTrendLabel(daysActive);
                  return (
                    <li
                      key={ad.id}
                      onClick={() => fetchAdDetails(ad.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all hover:shadow-md border-l-4 ${isSelected
                        ? 'bg-blue-50 border-blue-500 shadow-sm'
                        : 'border-transparent hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-gray-800 text-sm flex-1">{ad.page_name}</h3>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${getDaysColor(daysActive)}`}>
                          📅 {daysActive}d
                        </span>
                      </div>
                      <div className={`text-xs font-medium px-2 py-0.5 rounded ${trend.color} inline-block mt-1`}>
                        {trend.label}
                      </div>
                      <p className="text-gray-600 text-xs mt-1 line-clamp-2">{truncateText(ad.body, 100)}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {ad.price && ad.price.original && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                            💰 {ad.price.currency} {ad.price.original}
                          </span>
                        )}
                        {ad.niches && ad.niches.length > 0 && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                            🏷️ {ad.niches[0]}
                          </span>
                        )}
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          🌍 {ad.country_code}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Panel de Detalles */}
          <div className="md:w-3/5 bg-white rounded-lg shadow-md p-6 max-h-[75vh] overflow-y-auto">
            {selectedAd ? (
              <div>
                {selectedAd.snapshot_url && (
                  <div className="mb-4 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                    <img
                      src={selectedAd.snapshot_url}
                      alt="Vista previa del anuncio"
                      className="w-full object-contain max-h-56"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSA4IDUgMjEgMjEgMjEiLz48L3N2Zz4=';
                      }}
                    />
                  </div>
                )}
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedAd.page_name}</h2>
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{selectedAd.body}</p>
                <div className="grid grid-cols-2 gap-3 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <span className="text-xs text-gray-500">📅 Días activos</span>
                    <p className="font-bold text-lg">{getDaysActive(selectedAd.start_time)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">🌍 País</span>
                    <p className="font-bold text-lg">{selectedAd.country_code}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">🏷️ Nicho</span>
                    <p className="font-bold text-lg">{selectedAd.niches?.join(', ') || 'General'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">💰 Precio</span>
                    {selectedAd.price && selectedAd.price.original ? (
                      <p className="font-bold text-lg text-green-700">{selectedAd.price.currency} {selectedAd.price.original}</p>
                    ) : (
                      <p className="text-gray-400 italic text-sm">No detectado</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-400 border-t pt-2">
                  <p>🆔 ID: {selectedAd.id}</p>
                  <p>📆 Primera vez: {new Date(selectedAd.first_seen).toLocaleString()}</p>
                  <p>🔄 Última vez: {new Date(selectedAd.last_seen).toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p className="text-4xl mb-2">👈</p>
                <p className="font-medium">Selecciona un anuncio</p>
                <p className="text-sm">para ver los detalles completos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
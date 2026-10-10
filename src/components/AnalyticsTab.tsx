import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart2,
  PieChart,
  Award,
  Zap,
  Target,
  ArrowUpRight,
  Sparkles,
  Flame,
  Check,
  Search,
  Filter,
  Layers,
  Activity,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Track, Artist, ExternalPlaylist } from '../types/curator';

interface AnalyticsTabProps {
  tracks: Track[];
  artists: Artist[];
  externalPlaylists: ExternalPlaylist[];
}

const PALETTE = [
  { stroke: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/40' }, // Emerald
  { stroke: '#8b5cf6', bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/40' },   // Purple
  { stroke: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/40' },     // Amber
  { stroke: '#06b6d4', bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500/40' },       // Cyan
  { stroke: '#f43f5e', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/40' },       // Rose
  { stroke: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/40' },       // Blue
  { stroke: '#ec4899', bg: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500/40' },       // Pink
  { stroke: '#14b8a6', bg: 'bg-teal-500', text: 'text-teal-400', border: 'border-teal-500/40' },       // Teal
];

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  tracks,
  artists,
  externalPlaylists,
}) => {
  // Chart visualization configuration
  const [chartMode, setChartMode] = useState<'weekly' | 'cumulative'>('weekly');
  const [timeRange, setTimeRange] = useState<'6w' | '8w'>('6w');
  const [trackSearch, setTrackSearch] = useState('');

  // Default selection: top 4 tracks by stream count
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>(() => {
    const sorted = [...tracks].sort((a, b) => b.streams - a.streams);
    return sorted.slice(0, 4).map((t) => t.id);
  });

  // Compute overall catalog metrics
  const totalStreams = tracks.reduce((acc, t) => acc + t.streams, 0);
  const totalPrevStreams = tracks.reduce((acc, t) => acc + t.previousWeeklyStreams, 0);
  const catalogOverallGrowth =
    totalPrevStreams > 0 ? ((totalStreams - totalPrevStreams) / totalPrevStreams) * 100 : 0;

  const avgPopularity = Math.round(
    tracks.reduce((acc, t) => acc + t.popularity, 0) / (tracks.length || 1)
  );

  // Top trending tracks (highest % growth)
  const topTrending = useMemo(
    () => [...tracks].sort((a, b) => b.weeklyTrendPercent - a.weeklyTrendPercent),
    [tracks]
  );

  // Genre breakdown
  const sortedGenres = useMemo(() => {
    const counts: Record<string, { count: number; streams: number }> = {};
    tracks.forEach((t) => {
      if (!counts[t.genre]) {
        counts[t.genre] = { count: 0, streams: 0 };
      }
      counts[t.genre].count += 1;
      counts[t.genre].streams += t.streams;
    });
    return Object.entries(counts).sort((a, b) => b[1].streams - a[1].streams);
  }, [tracks]);

  // Color mapping per track based on selection index
  const trackColorMap = useMemo(() => {
    const map = new Map<string, typeof PALETTE[0]>();
    selectedTrackIds.forEach((id, idx) => {
      map.set(id, PALETTE[idx % PALETTE.length]);
    });
    return map;
  }, [selectedTrackIds]);

  // Week labels based on selected time window
  const weekConfig = useMemo(() => {
    if (timeRange === '8w') {
      return [
        { key: 'W-7', label: 'Mgg -7' },
        { key: 'W-6', label: 'Mgg -6' },
        { key: 'W-5', label: 'Mgg -5' },
        { key: 'W-4', label: 'Mgg -4' },
        { key: 'W-3', label: 'Mgg -3' },
        { key: 'W-2', label: 'Mgg -2' },
        { key: 'W-1', label: 'Minggu Lalu' },
        { key: 'W-0', label: 'Minggu Ini' },
      ];
    }
    return [
      { key: 'W-5', label: 'Mgg -5' },
      { key: 'W-4', label: 'Mgg -4' },
      { key: 'W-3', label: 'Mgg -3' },
      { key: 'W-2', label: 'Mgg -2' },
      { key: 'W-1', label: 'Minggu Lalu' },
      { key: 'W-0', label: 'Minggu Ini' },
    ];
  }, [timeRange]);

  /**
   * Menghasilkan histori data stream mingguan untuk setiap lagu secara realistis dan deterministik.
   */
  const getTrackHistory = (track: Track, weeksCount: number) => {
    const currentTotal = track.streams;
    const currentWeekly = track.weeklyStreams || Math.round(currentTotal * 0.06);
    const trendPercent = track.weeklyTrendPercent || 5.0;

    const weeklyVolumes: number[] = [];
    for (let i = weeksCount - 1; i >= 0; i--) {
      if (i === 0) {
        weeklyVolumes.push(currentWeekly);
      } else {
        const decay = Math.pow(1 / (1 + trendPercent / 100), i);
        // Pseudo-random deterministic jitter berdasarkan hash karakter track id
        const charCode = track.id.charCodeAt(track.id.length - 1 - (i % track.id.length)) || 80;
        const jitter = 1 + ((charCode % 5) - 2) * 0.015;
        const vol = Math.max(10, Math.round(currentWeekly * decay * jitter));
        weeklyVolumes.push(vol);
      }
    }

    // Hitung kumulatif total
    const cumulativeTotals: number[] = [];
    let running = currentTotal;
    for (let i = weeklyVolumes.length - 1; i >= 0; i--) {
      cumulativeTotals[i] = running;
      if (i > 0) {
        running = Math.max(0, running - weeklyVolumes[i]);
      }
    }

    return {
      weekly: weeklyVolumes,
      cumulative: cumulativeTotals,
    };
  };

  // Build chart dataset for Recharts
  const chartData = useMemo(() => {
    const weeksCount = weekConfig.length;
    return weekConfig.map((w, index) => {
      const row: Record<string, any> = {
        week: w.label,
        weekKey: w.key,
      };

      selectedTrackIds.forEach((trackId) => {
        const track = tracks.find((t) => t.id === trackId);
        if (!track) return;
        const history = getTrackHistory(track, weeksCount);
        row[trackId] = chartMode === 'weekly' ? history.weekly[index] : history.cumulative[index];
      });

      return row;
    });
  }, [weekConfig, selectedTrackIds, tracks, chartMode]);

  // Track selection handlers
  const toggleTrackSelection = (trackId: string) => {
    setSelectedTrackIds((prev) => {
      if (prev.includes(trackId)) {
        if (prev.length === 1) return prev; // Keep at least one track
        return prev.filter((id) => id !== trackId);
      } else {
        if (prev.length >= 8) {
          alert('Maksimal 8 lagu dapat dibandingkan sekaligus pada grafik agar visual tetap terbaca.');
          return prev;
        }
        return [...prev, trackId];
      }
    });
  };

  const selectTopPlays = (count = 4) => {
    const sorted = [...tracks].sort((a, b) => b.streams - a.streams);
    setSelectedTrackIds(sorted.slice(0, count).map((t) => t.id));
  };

  const selectTopGrowth = (count = 4) => {
    setSelectedTrackIds(topTrending.slice(0, count).map((t) => t.id));
  };

  const filteredTracks = useMemo(() => {
    if (!trackSearch.trim()) return tracks;
    const query = trackSearch.toLowerCase();
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.artist.toLowerCase().includes(query) ||
        t.genre.toLowerCase().includes(query)
    );
  }, [tracks, trackSearch]);

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md min-w-[220px] z-50">
          <div className="text-xs font-semibold text-slate-300 pb-2 mb-2 border-b border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              {label}
            </span>
            <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">
              {chartMode === 'weekly' ? 'Volume Mingguan' : 'Akumulasi Total'}
            </span>
          </div>
          <div className="space-y-2">
            {payload.map((entry: any) => {
              const track = tracks.find((t) => t.id === entry.dataKey);
              if (!track) return null;
              return (
                <div key={entry.dataKey} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: entry.color }}
                    />
                    <div className="min-w-0">
                      <span className="text-slate-100 font-semibold block truncate max-w-[130px]">
                        {track.title}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {track.artist}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <span className="font-bold text-slate-100 block">
                      {Number(entry.value).toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-emerald-400">
                      +{track.weeklyTrendPercent.toFixed(1)}% WoW
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium block">Total Akumulasi Stream</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {totalStreams >= 1000000
                ? `${(totalStreams / 1000000).toFixed(1)} Juta`
                : `${totalStreams.toLocaleString('id-ID')} Plays`}
            </span>
            <span
              className={`text-xs font-bold ${
                catalogOverallGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {catalogOverallGrowth >= 0 ? '+' : ''}
              {catalogOverallGrowth.toFixed(1)}% WoW
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Dari {tracks.length} lagu terkatalog</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium block">Rata-Rata Popularitas Katalog</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{avgPopularity}</span>
            <span className="text-xs text-slate-400">/ 100 Skala Spotify</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${avgPopularity}%` }}></div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium block">Top Performer (Pertumbuhan)</span>
          <div className="mt-1 flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-base font-bold text-slate-100 truncate">
              {topTrending[0]?.title || '-'}
            </span>
          </div>
          <span className="text-xs text-emerald-400 font-semibold block mt-0.5">
            +{topTrending[0]?.weeklyTrendPercent.toFixed(1)}% ({topTrending[0]?.artist})
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium block">Jangkauan Playlist Eksternal</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-purple-400">
              {externalPlaylists.reduce((acc, p) => acc + p.followers, 0).toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-400">Pengikut</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {externalPlaylists.length} playlist terdaftar
          </span>
        </div>
      </div>

      {/* Multi-Line Chart Section using Recharts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
        {/* Header with Title and Mode Toggles */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Multi-Line Historical Stream Growth
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pemetaan tren pertumbuhan stream historis per minggu untuk membandingkan performa lagu-lagu pilihan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Metric Mode Toggle */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setChartMode('weekly')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  chartMode === 'weekly'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Volume Mingguan
              </button>
              <button
                type="button"
                onClick={() => setChartMode('cumulative')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  chartMode === 'cumulative'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Akumulasi Total
              </button>
            </div>

            {/* Time Range Toggle */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setTimeRange('6w')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                  timeRange === '6w'
                    ? 'bg-slate-800 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                6 Minggu
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('8w')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                  timeRange === '8w'
                    ? 'bg-slate-800 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                8 Minggu
              </button>
            </div>
          </div>
        </div>

        {/* Track Selection Bar & Presets */}
        <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                Pilih Lagu untuk Ditampilkan di Garis Tren ({selectedTrackIds.length}/8 aktif):
              </span>
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 mr-1">Preset:</span>
              <button
                type="button"
                onClick={() => selectTopPlays(4)}
                className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white transition-colors"
              >
                Top 4 Plays
              </button>
              <button
                type="button"
                onClick={() => selectTopGrowth(4)}
                className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white transition-colors"
              >
                Top 4 Trending
              </button>
              <button
                type="button"
                onClick={() => selectTopPlays(Math.min(tracks.length, 8))}
                className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white transition-colors"
              >
                Pilih Max (8)
              </button>
            </div>
          </div>

          {/* Search filter for catalog tracks */}
          {tracks.length > 6 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Cari lagu dalam katalog untuk ditambahkan ke grafik..."
                value={trackSearch}
                onChange={(e) => setTrackSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500/50"
              />
            </div>
          )}

          {/* Interactive track chips */}
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
            {filteredTracks.map((track) => {
              const isSelected = selectedTrackIds.includes(track.id);
              const colorConfig = trackColorMap.get(track.id);

              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => toggleTrackSelection(track.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all border ${
                    isSelected
                      ? `bg-slate-900 text-slate-100 ${colorConfig?.border || 'border-emerald-500/40'} shadow-sm`
                      : 'bg-slate-900/40 text-slate-400 border-slate-800/80 hover:bg-slate-800/50 hover:text-slate-300'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform ${
                      isSelected ? 'scale-110 shadow-sm' : 'opacity-40'
                    }`}
                    style={{
                      backgroundColor: isSelected && colorConfig ? colorConfig.stroke : '#64748b',
                    }}
                  />
                  <span className="truncate max-w-[150px]">{track.title}</span>
                  {isSelected ? (
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {track.streams.toLocaleString('id-ID')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recharts Multi-Line Graph */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 15, right: 25, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="week"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(value: number) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                  return String(value);
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value, entry: any) => {
                  const track = tracks.find((t) => t.id === entry.dataKey);
                  return (
                    <span className="text-xs text-slate-300 font-medium mr-3">
                      {track?.title || value}
                    </span>
                  );
                }}
                wrapperStyle={{ paddingTop: 12 }}
              />
              {selectedTrackIds.map((trackId) => {
                const track = tracks.find((t) => t.id === trackId);
                const colorConfig = trackColorMap.get(trackId);
                const strokeColor = colorConfig?.stroke || '#10b981';

                return (
                  <Line
                    key={trackId}
                    type="monotone"
                    dataKey={trackId}
                    name={track?.title || 'Track'}
                    stroke={strokeColor}
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: strokeColor, strokeWidth: 1.5, stroke: '#0f172a' }}
                    activeDot={{ r: 6, fill: strokeColor, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Velocity / Performance Breakdown Table for Selected Tracks */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Statistik Performa Lagu Terpilih
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Mode: {chartMode === 'weekly' ? 'Volume Mingguan' : 'Akumulasi Total'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {selectedTrackIds.map((trackId) => {
              const track = tracks.find((t) => t.id === trackId);
              if (!track) return null;
              const colorConfig = trackColorMap.get(trackId);

              return (
                <div
                  key={trackId}
                  className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: colorConfig?.stroke || '#10b981' }}
                  />
                  <div className="flex items-start justify-between gap-2 mt-1">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-100 truncate">
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      +{track.weeklyTrendPercent.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-baseline justify-between text-xs font-mono">
                    <span className="text-slate-500 text-[10px]">Total Plays</span>
                    <span className="font-bold text-slate-200">
                      {track.streams.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs font-mono mt-0.5">
                    <span className="text-slate-500 text-[10px]">Plays / Minggu</span>
                    <span className="text-emerald-400 font-semibold">
                      +{track.weeklyStreams.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two columns: Top Tracks vs Genre Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Momentum Tracks */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Top 5 Lagu dengan Momentum Terpesat (Weekly Growth)
          </h3>
          <div className="space-y-3">
            {topTrending.slice(0, 5).map((track, i) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-500 w-4">
                    #{i + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{track.title}</h4>
                    <p className="text-[11px] text-slate-400">{track.artist}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400 font-mono block">
                    +{track.weeklyTrendPercent.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {track.streams.toLocaleString('id-ID')} streams
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Genre Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            Pangsa Genre dalam Katalog Musik
          </h3>
          <div className="space-y-3">
            {sortedGenres.map(([genre, data]) => {
              const streamShare = Math.round((data.streams / (totalStreams || 1)) * 100);
              return (
                <div key={genre} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-200">
                      {genre}{' '}
                      <span className="text-slate-500 text-[11px]">({data.count} Lagu)</span>
                    </span>
                    <span className="font-mono text-emerald-400 font-semibold">{streamShare}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${streamShare}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Decision Matrix for Curators */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-slate-100 mb-2 flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          Decision Matrix: Rekomendasi Tindakan Kurator
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Pedoman berbasis analitik untuk menentukan strategi playlist pitching, promosi artis, dan alokasi katalog.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <div className="font-bold text-emerald-400 text-sm flex items-center gap-1.5 mb-1.5">
              <ArrowUpRight className="w-4 h-4" />
              Prioritas Pitching Utama
            </div>
            <p className="text-slate-300 leading-relaxed mb-2">
              Lagu dengan pertumbuhan &gt;4% per minggu (misal: <em>Stranger</em>, <em>Yellow Sweater</em>).
            </p>
            <div className="text-[11px] text-emerald-300 font-semibold">
              Tindakan: Masukkan ke posisi Top 5 di Playlist Komunitas & Mix Kurator eksternal.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
            <div className="font-bold text-blue-400 text-sm flex items-center gap-1.5 mb-1.5">
              <Award className="w-4 h-4" />
              Katalog Evergreen (Pondasi)
            </div>
            <p className="text-slate-300 leading-relaxed mb-2">
              Lagu katalog inti dengan stream stabil (misal: <em>Purpose</em>, <em>11:00 PM</em>, <em>Cozy in My Agony</em>).
            </p>
            <div className="text-[11px] text-blue-300 font-semibold">
              Tindakan: Pertahankan di playlist Discography of eL Utama dan mood malam hari.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
            <div className="font-bold text-purple-400 text-sm flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-4 h-4" />
              Eksplorasi Kompilasi & Playlist Lain
            </div>
            <p className="text-slate-300 leading-relaxed mb-2">
              Track yang lolos kurasi pihak ketiga (misal: 6 track eL Utama di <em>MixArt SEPT #16</em> oleh TOTAL PLAY-L*ST).
            </p>
            <div className="text-[11px] text-purple-300 font-semibold">
              Tindakan: Pantau performa stream inflow mingguan untuk evaluasi kerja sama kurator.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

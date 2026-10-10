import React, { useState } from 'react';
import {
  Plus,
  Radio,
  Users,
  ExternalLink,
  Edit2,
  Trash2,
  Sparkles,
  Link,
  BarChart3,
  Music,
} from 'lucide-react';
import { ExternalPlaylist } from '../types/curator';

interface ExternalPlaylistsTabProps {
  playlists: ExternalPlaylist[];
  onAddPlaylist: () => void;
  onAddPlaylistWithUrl?: (url: string) => void;
  onEditPlaylist: (playlist: ExternalPlaylist) => void;
  onDeletePlaylist: (id: string) => void;
}

export const ExternalPlaylistsTab: React.FC<ExternalPlaylistsTabProps> = ({
  playlists,
  onAddPlaylist,
  onAddPlaylistWithUrl,
  onEditPlaylist,
  onDeletePlaylist,
}) => {
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [quickSpotifyUrl, setQuickSpotifyUrl] = useState('');

  const filteredPlaylists = playlists.filter(
    (p) => filterPlatform === 'all' || p.platform === filterPlatform
  );

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSpotifyUrl.trim()) return;

    if (onAddPlaylistWithUrl) {
      onAddPlaylistWithUrl(quickSpotifyUrl.trim());
    } else {
      onAddPlaylist();
    }
    setQuickSpotifyUrl('');
  };

  return (
    <div className="space-y-5">
      {/* Quick Add Via Spotify Link Bar */}
      <div className="p-4 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 rounded-2xl shadow-lg">
        <form onSubmit={handleQuickAdd} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Tambah Playlist Lain via Link Spotify
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-purple-500/20 text-purple-300">
                  Editorial / Komunitas
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Tempel link Spotify Playlist untuk menarik judul, kurator, jumlah lagu, follower, dan estimasi stream
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Link className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={quickSpotifyUrl}
                onChange={(e) => setQuickSpotifyUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
              />
            </div>
            <button
              type="submit"
              disabled={!quickSpotifyUrl.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah via Link</span>
            </button>
          </div>
        </form>
      </div>

      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs md:text-sm text-slate-200 focus:outline-hidden focus:border-purple-500"
          >
            <option value="all">Semua Tipe Playlist Eksternal ({playlists.length})</option>
            <option value="Spotify Editorial">Spotify Editorial</option>
            <option value="Spotify Community">Spotify Komunitas / Kurator</option>
            <option value="Apple Music">Apple Music</option>
            <option value="YouTube Mix">YouTube Mix</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onAddPlaylist}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Playlist Eksternal</span>
        </button>
      </div>

      {/* Playlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPlaylists.map((ep) => (
          <div
            key={ep.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-slate-800 overflow-hidden border border-slate-700/80 shrink-0 shadow-md">
                    {ep.coverUrl ? (
                      <img
                        src={ep.coverUrl}
                        alt={ep.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-500/10 text-purple-400">
                        <Radio className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-100 truncate">{ep.title}</h3>
                    <p className="text-xs text-slate-400 truncate">
                      Oleh: <span className="text-slate-200 font-medium">{ep.curatedBy}</span>
                    </p>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Music className="w-3 h-3 text-purple-400" />
                      {ep.trackInclusionCount || 40} Lagu Terpantau
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {ep.playlistUrl && (
                    <a
                      href={ep.playlistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-purple-400 transition-colors"
                      title="Buka di Spotify"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => onEditPlaylist(ep)}
                    className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                    title="Edit Playlist"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePlaylist(ep.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {ep.platform}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {ep.primaryGenre}
                </span>
                {ep.mood && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    Mood: {ep.mood}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">
                    Followers / Pengikut
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-200">
                    {ep.followers?.toLocaleString('id-ID') || '0'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">
                    Estimasi Stream / Mgg
                  </span>
                  <span className="text-sm font-bold font-mono text-purple-400">
                    {ep.estimatedWeeklyStreams >= 1000000
                      ? `${(ep.estimatedWeeklyStreams / 1000000).toFixed(2)} Juta`
                      : `${(ep.estimatedWeeklyStreams || 0).toLocaleString('id-ID')} plays`}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {ep.curatorNotes && (
                <p className="mt-3 text-xs text-slate-300 italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 line-clamp-2">
                  "{ep.curatorNotes}"
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">
                Sync Data: <strong className="text-slate-400 font-semibold">{ep.syncFrequency}</strong>
              </span>
              {ep.playlistUrl && (
                <a
                  href={ep.playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1 text-[11px]"
                >
                  Buka Playlist <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

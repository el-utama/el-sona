import React, { useState } from 'react';
import {
  Plus,
  Disc,
  Music,
  Clock,
  Edit2,
  Trash2,
  Link,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { MainPlaylist, Track } from '../types/curator';

interface MainPlaylistsTabProps {
  playlists: MainPlaylist[];
  tracks: Track[];
  onAddPlaylist: () => void;
  onAddPlaylistWithUrl?: (url: string) => void;
  onEditPlaylist: (playlist: MainPlaylist) => void;
  onDeletePlaylist: (id: string) => void;
}

export const MainPlaylistsTab: React.FC<MainPlaylistsTabProps> = ({
  playlists,
  tracks,
  onAddPlaylist,
  onAddPlaylistWithUrl,
  onEditPlaylist,
  onDeletePlaylist,
}) => {
  const [selectedArtist, setSelectedArtist] = useState<string>('all');
  const [quickSpotifyUrl, setQuickSpotifyUrl] = useState('');

  const artists = Array.from(new Set(playlists.map((p) => p.artist)));

  const filteredPlaylists = playlists.filter(
    (p) => selectedArtist === 'all' || p.artist === selectedArtist
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
      <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 rounded-2xl shadow-lg">
        <form onSubmit={handleQuickAdd} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Tambah Playlist Utama via Link Spotify
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-300">
                  Album / Discography
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Tempel link Spotify Album atau Playlist untuk otomatis mengimpor rilis & daftar lagu ke katalog
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
                placeholder="https://open.spotify.com/album/... atau /playlist/..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={!quickSpotifyUrl.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah via Link</span>
            </button>
          </div>
        </form>
      </div>

      {/* Top Filter & Manual Add */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={selectedArtist}
            onChange={(e) => setSelectedArtist(e.target.value)}
            className="px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs md:text-sm text-slate-200 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">Semua Artis / Discography ({artists.length})</option>
            {artists.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onAddPlaylist}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Discography / Album</span>
        </button>
      </div>

      {/* Playlist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredPlaylists.map((pl) => {
          // Find matching tracks in catalog
          const catalogTracks = tracks.filter((t) => pl.trackIds?.includes(t.id));

          return (
            <div
              key={pl.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-800 overflow-hidden border border-slate-700/80 shrink-0 shadow-md">
                    <img
                      src={pl.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop'}
                      alt={pl.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {pl.type} • {pl.releaseYear}
                      </span>
                      <div className="flex items-center gap-1">
                        {pl.playlistUrl && (
                          <a
                            href={pl.playlistUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Buka di Spotify"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditPlaylist(pl)}
                          className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                          title="Edit Playlist"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePlaylist(pl.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-100 truncate mt-1">
                      {pl.title}
                    </h3>
                    <p className="text-xs text-slate-400">{pl.artist}</p>
                  </div>
                </div>

                {/* Details badge */}
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Music className="w-3.5 h-3.5 text-emerald-400" />
                    {pl.totalTracks} Lagu
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Durasi: {pl.totalDuration}
                  </span>
                </div>

                {/* Curator notes */}
                {pl.notes && (
                  <p className="mt-2.5 text-xs text-slate-300 italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 line-clamp-2">
                    "{pl.notes}"
                  </p>
                )}

                {/* Tracklist Preview */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                      Lagu Terpilih di Katalog:
                    </h4>
                    {catalogTracks.length > 0 && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {catalogTracks.length} Lagu Terhubung
                      </span>
                    )}
                  </div>
                  {catalogTracks.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      Lagu album ini belum ditautkan ke tabel Lagu.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {catalogTracks.map((t, idx) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/50 hover:bg-slate-800/60 transition-colors"
                        >
                          <span className="text-slate-300 truncate">
                            <span className="text-slate-500 font-mono mr-2">{idx + 1}.</span>
                            {t.title}
                          </span>
                          <span className="text-emerald-400 font-mono text-[11px] shrink-0 ml-2">
                            {t.streams.toLocaleString('id-ID')} streams
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

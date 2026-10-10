import React, { useState } from 'react';
import { Plus, Users, ExternalLink, Edit2, Trash2, Music, Download, Sparkles } from 'lucide-react';
import { Artist, Track } from '../types/curator';

interface ArtistsTabProps {
  artists: Artist[];
  tracks: Track[];
  onAddArtist: () => void;
  onEditArtist: (artist: Artist) => void;
  onDeleteArtist: (artistId: string) => void;
  onImportArtistTracks?: (artist: Artist) => void;
}

export const ArtistsTab: React.FC<ArtistsTabProps> = ({
  artists,
  tracks,
  onAddArtist,
  onEditArtist,
  onDeleteArtist,
  onImportArtistTracks,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredArtists = artists.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.primaryGenre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Search & Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Cari nama artis, genre, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 shadow-xs"
          />
        </div>

        <button
          type="button"
          onClick={onAddArtist}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Tambah Artis via Link Spotify</span>
        </button>
      </div>

      {/* Grid of Artist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArtists.map((artist) => {
          const statusColors: Record<string, string> = {
            Trending: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            Established: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            Rising: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            Watchlist: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          };

          // Calculate Total Streams strictly from unique catalog tracks without duplicate or dummy data
          const artistSongMap = new Map<string, number>();
          tracks.forEach((t) => {
            const isMatch =
              t.artist.toLowerCase().includes(artist.name.toLowerCase()) ||
              artist.name.toLowerCase().includes(t.artist.toLowerCase());
            if (isMatch) {
              const key = t.id ? t.id : `${t.artist.toLowerCase()}:::${t.title.toLowerCase()}`;
              if (!artistSongMap.has(key)) {
                artistSongMap.set(key, Number(t.streams) || 0);
              }
            }
          });
          const realArtistTotalStreams =
            artistSongMap.size > 0
              ? Array.from(artistSongMap.values()).reduce((sum, s) => sum + s, 0)
              : Number(artist.totalStreams) || 0;
          const realArtistTrackCount =
            artistSongMap.size > 0 ? artistSongMap.size : artist.trackCount || 0;

          return (
            <div
              key={artist.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {artist.photoUrl ? (
                      <img
                        src={artist.photoUrl}
                        alt={artist.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-100">{artist.name}</h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            statusColors[artist.status] || 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {artist.status}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-400 font-medium mt-0.5">
                        {artist.primaryGenre}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditArtist(artist)}
                      className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                      title="Edit Artis"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteArtist(artist.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Hapus Artis"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sub-genres */}
                {artist.subGenres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {artist.subGenres.map((sub, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-950/70 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">
                      Followers
                    </span>
                    <span className="text-xs md:text-sm font-bold font-mono text-slate-100">
                      {(artist.followers || 285).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">
                      Monthly
                    </span>
                    <span className="text-xs md:text-sm font-bold font-mono text-slate-200">
                      {artist.monthlyListeners.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">
                      Total Stream Lagu
                    </span>
                    <span className="text-xs md:text-sm font-bold font-mono text-emerald-400">
                      {realArtistTotalStreams >= 1000000
                        ? `${(realArtistTotalStreams / 1000000).toFixed(1)}M`
                        : realArtistTotalStreams >= 1000
                        ? `${(realArtistTotalStreams / 1000).toFixed(1)}k`
                        : `${realArtistTotalStreams.toLocaleString('id-ID')} plays`}
                    </span>
                  </div>
                </div>

                {/* Popularity bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Popularitas Industri</span>
                    <span className="font-bold text-slate-200">{artist.popularity}/100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${artist.popularity}%` }}
                    ></div>
                  </div>
                </div>

                {/* Curator notes */}
                {artist.curatorNotes && (
                  <div className="mt-3.5 p-2.5 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs text-slate-300 italic">
                    "{artist.curatorNotes}"
                  </div>
                )}
              </div>

              {/* Action: Import all tracks of this artist */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                {onImportArtistTracks && (
                  <button
                    type="button"
                    onClick={() => onImportArtistTracks(artist)}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-emerald-950/60 hover:border-emerald-500/40 border border-slate-700/80 text-emerald-300 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>📥 Impor Semua Lagu {artist.name} ke Katalog (Sheet 2)</span>
                  </button>
                )}

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 text-[11px] flex items-center gap-1">
                    <Music className="w-3 h-3 text-slate-400" />
                    {realArtistTrackCount} lagu terkatalog
                  </span>
                  {artist.profileUrl && (
                    <a
                      href={artist.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 text-[11px]"
                    >
                      Buka di Spotify <ExternalLink className="w-3 h-3" />
                    </a>
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

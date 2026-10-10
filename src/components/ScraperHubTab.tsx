import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Sparkles,
  Link,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Terminal,
  Play,
  Pause,
  Music,
  Users,
  Disc,
  Radio,
} from 'lucide-react';
import {
  autoFetchMetadataFromUrl,
  generateGoogleAppsScriptCode,
  ScrapedTrackInfo,
} from '../services/musicScraper';

export const ScraperHubTab: React.FC = () => {
  const [testUrl, setTestUrl] = useState('https://open.spotify.com/track/4VrrRjWZweNZwlTgZiAFfp');
  const [isLoading, setIsLoading] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<ScrapedTrackInfo | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const scriptCode = generateGoogleAppsScriptCode();

  const presets = [
    {
      label: '🎵 Lagu: Stranger',
      url: 'https://open.spotify.com/track/4VrrRjWZweNZwlTgZiAFfp',
      desc: 'Track eL Utama (3.742 plays, 03:43)',
    },
    {
      label: '🎤 Artis: eL Utama',
      url: 'https://open.spotify.com/artist/1JnABAdezw4hHakOvhIOyc',
      desc: 'Profil artis (290 listeners, <300 followers)',
    },
    {
      label: '💿 Diskografi eL Utama',
      url: 'https://open.spotify.com/playlist/5dIMnUkTwxmwnPOMgs8ZH1',
      desc: 'Playlist diskografi 53 track resmi',
    },
    {
      label: '📻 Playlist Lain: MixArt SEPT #16',
      url: 'https://open.spotify.com/playlist/1Nt1jTW7Nm57MhIkIOdHBH',
      desc: 'Kompilasi kurasi eksternal (~74 followers)',
    },
  ];

  const handleTestScrape = async () => {
    if (!testUrl.trim()) return;
    setIsLoading(true);
    setScrapeError(null);
    setScrapeResult(null);

    try {
      const res = await autoFetchMetadataFromUrl(testUrl);
      setScrapeResult(res);
    } catch (e: any) {
      console.error(e);
      setScrapeError(e.message || 'Gagal mengekstrak data dari URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const togglePlayAudio = (url?: string) => {
    if (!url) return;
    if (isPlaying && audioEl) {
      audioEl.pause();
      setIsPlaying(false);
    } else {
      if (audioEl) audioEl.pause();
      const a = new Audio(url);
      a.play().catch((err) => console.warn('Preview error:', err));
      a.onended = () => setIsPlaying(false);
      setAudioEl(a);
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Solusi Utama Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-100">
              Live Scraper Aktif (Tanpa Biaya & Tanpa Akun Developer Berbayar)
            </h2>
            <p className="mt-1 text-xs md:text-sm text-slate-300 leading-relaxed">
              Scraper backend telah dihubungkan langsung ke mesin ekstraksi metadata Spotify publik. 
              Sistem mengekstrak data langsung dari link Lagu, Artis, dan Playlist tanpa memerlukan token OAuth berbayar atau batasan kuota rumit.
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-400 block mb-2">
            Klik Cepat Link Target Kurasi Anda:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.url}
                type="button"
                onClick={() => {
                  setTestUrl(preset.url);
                  setScrapeResult(null);
                  setScrapeError(null);
                }}
                className={`p-3 text-left rounded-xl border transition-all text-xs ${
                  testUrl === preset.url
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-bold block truncate">{preset.label}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                  {preset.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Scraper Sandbox */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-slate-100">
            Uji Coba Scraper Live (Real-Time)
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Tempelkan URL Spotify (lagu, artis, diskografi, atau playlist lain) lalu klik <strong>Uji Scrape Sekarang</strong>:
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Link className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://open.spotify.com/..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
          <button
            type="button"
            onClick={handleTestScrape}
            disabled={isLoading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Menganalisa URL...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Uji Scrape Sekarang
              </>
            )}
          </button>
        </div>

        {scrapeError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{scrapeError}</span>
          </div>
        )}

        {scrapeResult && (
          <div className="mt-5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 animate-in fade-in space-y-4">
            <div className="flex items-start gap-4">
              {scrapeResult.coverUrl && (
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700 shadow-md">
                  <img
                    src={scrapeResult.coverUrl}
                    alt={scrapeResult.title}
                    className="w-full h-full object-cover"
                  />
                  {scrapeResult.audioPreviewUrl && (
                    <button
                      type="button"
                      onClick={() => togglePlayAudio(scrapeResult.audioPreviewUrl)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center text-emerald-400 hover:bg-black/70 transition-colors"
                      title={isPlaying ? 'Jeda preview' : 'Putar sampel audio resmi'}
                    >
                      {isPlaying ? (
                        <Pause className="w-7 h-7 fill-emerald-400" />
                      ) : (
                        <Play className="w-7 h-7 fill-emerald-400" />
                      )}
                    </button>
                  )}
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {scrapeResult.type?.toUpperCase() || 'METADATA RESMI'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {scrapeResult.source}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-slate-100 truncate">
                  {scrapeResult.title}
                </h4>
                <p className="text-xs text-slate-300 font-medium">
                  {scrapeResult.artist || scrapeResult.curator}
                </p>

                <div className="flex flex-wrap gap-3 text-xs text-slate-300 pt-2 font-mono">
                  {scrapeResult.duration && (
                    <span>
                      Durasi / Format: <strong className="text-slate-100">{scrapeResult.duration}</strong>
                    </span>
                  )}
                  {scrapeResult.releaseYear && (
                    <span>
                      Tahun: <strong className="text-slate-100">{scrapeResult.releaseYear}</strong>
                    </span>
                  )}
                  {scrapeResult.trackCount !== undefined && (
                    <span>
                      Total Track: <strong className="text-emerald-400">{scrapeResult.trackCount} Lagu</strong>
                    </span>
                  )}
                  {scrapeResult.audioPreviewUrl && (
                    <span className="text-emerald-400 font-sans text-[11px] flex items-center gap-1">
                      ✅ Preview MP3 Tersedia
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* If Playlist or Artist with tracks */}
            {scrapeResult.tracks && scrapeResult.tracks.length > 0 && (
              <div className="pt-3 border-t border-slate-800">
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Daftar Track Terdeteksi ({scrapeResult.tracks.length} lagu):
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {scrapeResult.tracks.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-slate-900 rounded-lg text-xs flex items-center justify-between border border-slate-850"
                    >
                      <span className="text-slate-200 truncate">
                        <span className="text-slate-500 mr-1.5 font-mono">{idx + 1}.</span>
                        {t.title}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px] shrink-0 ml-2">
                        {t.duration}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Google Apps Script Code Exporter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-emerald-400" />
              Kode Google Apps Script untuk Google Sheets
            </h3>
            <p className="text-xs text-slate-400">
              Gunakan script ini di Google Sheets Anda untuk memantau perkembangan stream tiap lagu secara otomatis setiap minggu
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyScript}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            {copiedCode ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                Tersalin ke Clipboard!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Salin Kode Script (1-Click)
              </>
            )}
          </button>
        </div>

        <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5 mb-4">
          <p className="font-semibold text-emerald-400">Cara Memasang di Google Sheets:</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
            <li>Buka Google Sheet yang telah diekspor oleh aplikasi ini.</li>
            <li>Buka menu: <strong>Ekstensi &gt; Apps Script</strong>.</li>
            <li>Hapus kode bawaan, tempelkan kode di bawah ini, lalu simpan (Ctrl+S / 💾).</li>
            <li>Refresh Google Sheet Anda. Menu <strong>🎵 Kurator Musik</strong> akan muncul di bar atas dengan opsi update otomatis dan trigger mingguan!</li>
          </ol>
        </div>

        <div className="relative bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-x-auto max-h-96 text-xs font-mono text-emerald-300/90 leading-relaxed">
          <pre>{scriptCode}</pre>
        </div>
      </div>
    </div>
  );
};

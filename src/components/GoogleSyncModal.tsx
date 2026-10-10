import React, { useState } from 'react';
import { X, FileSpreadsheet, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { Track, Artist, MainPlaylist, ExternalPlaylist } from '../types/curator';
import { createCuratorSpreadsheet, syncToExistingSpreadsheet } from '../services/googleWorkspace';
import { ConfirmationDialog } from './ConfirmationDialog';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  artists: Artist[];
  tracks: Track[];
  mainPlaylists: MainPlaylist[];
  externalPlaylists: ExternalPlaylist[];
  isGoogleConnected: boolean;
  onRequireAuth: () => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  artists,
  tracks,
  mainPlaylists,
  externalPlaylists,
  isGoogleConnected,
  onRequireAuth,
}) => {
  const [activeMode, setActiveMode] = useState<'new' | 'existing'>('new');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState(
    `Katalog Musik & Kurator Digital - ${new Date().toLocaleDateString('id-ID')}`
  );
  const [existingId, setExistingId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // User Confirmation state
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmDetails, setConfirmDetails] = useState<{
    title: string;
    message: string;
    detail: string;
    action: () => Promise<void>;
  } | null>(null);

  if (!isOpen) return null;

  const handleStartExportNew = () => {
    if (!isGoogleConnected) {
      onRequireAuth();
      return;
    }

    setConfirmDetails({
      title: 'Buat Spreadsheet Baru di Google Drive?',
      message:
        'Aplikasi akan membuat spreadsheet baru dengan 5 sheet terstruktur (Artis, Lagu, Playlist Utama, Playlist Lain, Tren & Analisis) dan mengunggah seluruh data katalog saat ini.',
      detail: `File: "${spreadsheetTitle}" (${tracks.length} lagu, ${artists.length} artis)`,
      action: async () => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
          const res = await createCuratorSpreadsheet(
            spreadsheetTitle,
            artists,
            tracks,
            mainPlaylists,
            externalPlaylists
          );
          setResultUrl(res.spreadsheetUrl);
        } catch (err: any) {
          setErrorMsg(err.message || 'Gagal membuat Google Sheet.');
        } finally {
          setIsLoading(false);
          setShowConfirm(false);
        }
      },
    });
    setShowConfirm(true);
  };

  const handleStartSyncExisting = () => {
    if (!isGoogleConnected) {
      onRequireAuth();
      return;
    }

    let parsedId = existingId.trim();
    if (parsedId.includes('/d/')) {
      const match = parsedId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) parsedId = match[1];
    }

    if (!parsedId) {
      setErrorMsg('Harap masukkan Spreadsheet ID atau tautan Google Sheet yang valid.');
      return;
    }

    setConfirmDetails({
      title: 'Perbarui & Timpa Data Spreadsheet yang Ada?',
      message:
        'Aplikasi akan memperbarui data pada sheet Artis, Lagu, Playlist Utama, dan Playlist Lain pada spreadsheet yang dipilih.',
      detail: `Spreadsheet ID: ${parsedId}`,
      action: async () => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
          await syncToExistingSpreadsheet(
            parsedId,
            artists,
            tracks,
            mainPlaylists,
            externalPlaylists
          );
          setResultUrl(`https://docs.google.com/spreadsheets/d/${parsedId}`);
        } catch (err: any) {
          setErrorMsg(err.message || 'Gagal menyinkronkan ke Google Sheet.');
        } finally {
          setIsLoading(false);
          setShowConfirm(false);
        }
      },
    });
    setShowConfirm(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Ekspor & Sinkronisasi Google Sheets</h2>
                <p className="text-xs text-slate-400">Sinkronkan 5 sheet kurasi ke Google Drive secara langsung</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!isGoogleConnected ? (
            <div className="my-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
              <p className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                Akun Google Belum Terhubung
              </p>
              <p className="mt-1 text-xs text-amber-300/90 leading-relaxed">
                Untuk membuat atau memperbarui spreadsheet di akun Google Drive Anda dengan izin Anda, silakan hubungkan akun Google terlebih dahulu.
              </p>
              <button
                type="button"
                onClick={onRequireAuth}
                className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
              >
                Masuk dengan Akun Google
              </button>
            </div>
          ) : (
            <div className="my-4 space-y-4">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('new');
                    setResultUrl(null);
                    setErrorMsg(null);
                  }}
                  className={`py-2 text-xs font-medium rounded-lg transition-all ${
                    activeMode === 'new'
                      ? 'bg-slate-800 text-emerald-400 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Buat Spreadsheet Baru
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('existing');
                    setResultUrl(null);
                    setErrorMsg(null);
                  }}
                  className={`py-2 text-xs font-medium rounded-lg transition-all ${
                    activeMode === 'existing'
                      ? 'bg-slate-800 text-emerald-400 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sinkron ke Sheet yang Ada
                </button>
              </div>

              {/* Mode: New Spreadsheet */}
              {activeMode === 'new' && (
                <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                  <label className="block text-xs font-medium text-slate-300">
                    Judul Spreadsheet Baru
                  </label>
                  <input
                    type="text"
                    value={spreadsheetTitle}
                    onChange={(e) => setSpreadsheetTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
                    <p className="font-semibold text-slate-300">Struktur Sheet Otomatis:</p>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 1. Artis (Profil & Stats)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 2. Lagu (Detail & Stream)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 3. Playlist Utama (Discography)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 4. Playlist Lain (Eksternal)
                      </span>
                      <span className="flex items-center gap-1.5 col-span-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> 5. Tren & Analisis (Formula Otomatis)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartExportNew}
                    disabled={isLoading}
                    className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isLoading ? 'Sedang Membuat Spreadsheet...' : '🚀 Buat Google Sheet Sekarang'}
                  </button>
                </div>
              )}

              {/* Mode: Existing Spreadsheet */}
              {activeMode === 'existing' && (
                <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                  <label className="block text-xs font-medium text-slate-300">
                    ID Spreadsheet atau Tautan URL Lengkap
                  </label>
                  <input
                    type="text"
                    value={existingId}
                    onChange={(e) => setExistingId(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1abc... atau ID"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Pastikan spreadsheet Anda sudah memiliki tab dengan nama: <strong>Artis</strong>, <strong>Lagu</strong>, <strong>Playlist Utama</strong>, dan <strong>Playlist Lain</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartSyncExisting}
                    disabled={isLoading}
                    className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isLoading ? 'Sedang Menyinkronkan...' : '🔄 Perbarui Google Sheet Ini'}
                  </button>
                </div>
              )}

              {/* Success Result Link */}
              {resultUrl && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-200">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Berhasil Dibuat / Diperbarui!
                  </div>
                  <p className="mt-1 text-xs text-slate-300">
                    Data katalog musik Anda telah tersedia di Google Drive.
                  </p>
                  <a
                    href={resultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
                  >
                    Buka Google Sheet <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog */}
      {confirmDetails && (
        <ConfirmationDialog
          isOpen={showConfirm}
          title={confirmDetails.title}
          message={confirmDetails.message}
          detail={confirmDetails.detail}
          confirmLabel="Lanjutkan & Sinkron"
          isLoading={isLoading}
          onConfirm={confirmDetails.action}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
};

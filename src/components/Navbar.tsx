import React from 'react';
import {
  FileSpreadsheet,
  Download,
  LogOut,
  Layers,
  Sparkles,
  Music,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  user: User | null;
  isGoogleConnected: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onOpenGoogleSync: () => void;
  onDownloadExcel: () => void;
  trackCount: number;
  artistCount: number;
  totalStreams: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isGoogleConnected,
  onLogin,
  onLogout,
  onOpenGoogleSync,
  onDownloadExcel,
  trackCount,
  artistCount,
  totalStreams,
}) => {
  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/30">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-100">
                  Sonata<span className="text-emerald-400">Vault</span>
                </span>
                <span className="hidden md:inline-flex text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Curator Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Katalog & Analisis Musik Multi-Sheet • Google Workspace
              </p>
            </div>
          </div>

          {/* Quick Metrics (Desktop) */}
          <div className="hidden lg:flex items-center gap-5 px-4 py-1.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300">
            <div>
              <span className="text-slate-500 text-[10px] uppercase block font-semibold">Lagu</span>
              <span className="font-bold font-mono text-slate-200">{trackCount} Lagu</span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block font-semibold">Artis</span>
              <span className="font-bold font-mono text-slate-200">{artistCount} Artis</span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block font-semibold">Total Streams</span>
              <span className="font-bold font-mono text-emerald-400">
                {totalStreams >= 1000000
                  ? `${(totalStreams / 1000000).toFixed(1)} Juta`
                  : `${totalStreams.toLocaleString('id-ID')} Plays`}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Download Excel (.xlsx) */}
            <button
              type="button"
              onClick={onDownloadExcel}
              title="Download Excel Workbook (.xlsx) dengan 5 Sheet terformat"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Download</span> Excel (.xlsx)
            </button>

            {/* Google Sheets Sync */}
            <button
              type="button"
              onClick={onOpenGoogleSync}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
              <span>Google Sheets</span>
            </button>

            {/* Google Auth Status / Button */}
            {isGoogleConnected && user ? (
              <div className="flex items-center gap-2 pl-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-emerald-500/40"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={onLogout}
                  title="Keluar dari akun Google"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                className="gsi-material-button inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-medium rounded-xl text-xs transition-all shadow-xs border border-slate-300 shrink-0"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span className="hidden sm:inline">Masuk Google</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

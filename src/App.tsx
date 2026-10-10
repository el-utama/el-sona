/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Music,
  Users,
  Disc,
  Radio,
  BarChart2,
  Terminal,
  CheckSquare,
  Sparkles,
  Info,
} from 'lucide-react';

import {
  Track,
  Artist,
  MainPlaylist,
  ExternalPlaylist,
  CuratorTask,
} from './types/curator';
import {
  INITIAL_ARTISTS,
  INITIAL_TRACKS,
  INITIAL_MAIN_PLAYLISTS,
  INITIAL_EXTERNAL_PLAYLISTS,
  INITIAL_CURATOR_TASKS,
} from './data/initialData';
import { initAuth, googleSignIn, logout, getAccessToken } from './services/firebaseAuth';
import { exportToExcelFile } from './services/excelExport';
import { batchSyncTracksFromScraper } from './services/musicScraper';

// Components
import { Navbar } from './components/Navbar';
import { TracksTab } from './components/TracksTab';
import { ArtistsTab } from './components/ArtistsTab';
import { MainPlaylistsTab } from './components/MainPlaylistsTab';
import { ExternalPlaylistsTab } from './components/ExternalPlaylistsTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { ScraperHubTab } from './components/ScraperHubTab';
import { TasksTab } from './components/TasksTab';
import { TrackModal } from './components/TrackModal';
import { ArtistModal } from './components/ArtistModal';
import { PlaylistModal } from './components/PlaylistModal';
import { ImportTracksModal } from './components/ImportTracksModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { ConfirmationDialog } from './components/ConfirmationDialog';

export default function App() {
  // Core Catalog State - Pure Real Data (eL Utama & linked playlists)
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('sonatavault_tracks_v4');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TRACKS;
  });

  const [artists, setArtists] = useState<Artist[]>(() => {
    try {
      const saved = localStorage.getItem('sonatavault_artists_v4');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_ARTISTS;
  });

  const [mainPlaylists, setMainPlaylists] = useState<MainPlaylist[]>(() => {
    try {
      const saved = localStorage.getItem('sonatavault_main_playlists_v4');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_MAIN_PLAYLISTS;
  });

  const [externalPlaylists, setExternalPlaylists] = useState<ExternalPlaylist[]>(() => {
    try {
      const saved = localStorage.getItem('sonatavault_external_playlists_v4');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_EXTERNAL_PLAYLISTS;
  });

  const [curatorTasks, setCuratorTasks] = useState<CuratorTask[]>(() => {
    try {
      const saved = localStorage.getItem('sonatavault_tasks_v4');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CURATOR_TASKS;
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'tracks' | 'artists' | 'mainPlaylists' | 'externalPlaylists' | 'analytics' | 'scraperHub' | 'tasks'
  >('tracks');

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  // Modals
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);

  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);

  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [playlistModalType, setPlaylistModalType] = useState<'main' | 'external'>('main');
  const [editingMainPlaylist, setEditingMainPlaylist] = useState<MainPlaylist | null>(null);
  const [editingExternalPlaylist, setEditingExternalPlaylist] = useState<ExternalPlaylist | null>(null);
  const [initialPlaylistUrl, setInitialPlaylistUrl] = useState('');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importModalUrl, setImportModalUrl] = useState('');

  const [isGoogleSyncModalOpen, setIsGoogleSyncModalOpen] = useState(false);

  // Destructive Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  // Persist Catalog Changes locally
  useEffect(() => {
    localStorage.setItem('sonatavault_tracks_v4', JSON.stringify(tracks));
  }, [tracks]);

  useEffect(() => {
    localStorage.setItem('sonatavault_artists_v4', JSON.stringify(artists));
  }, [artists]);

  useEffect(() => {
    localStorage.setItem('sonatavault_main_playlists_v4', JSON.stringify(mainPlaylists));
  }, [mainPlaylists]);

  useEffect(() => {
    localStorage.setItem('sonatavault_external_playlists_v4', JSON.stringify(externalPlaylists));
  }, [externalPlaylists]);

  useEffect(() => {
    localStorage.setItem('sonatavault_tasks_v4', JSON.stringify(curatorTasks));
  }, [curatorTasks]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setIsGoogleConnected(!!token);
      },
      () => {
        setUser(null);
        setIsGoogleConnected(false);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setIsGoogleConnected(true);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      alert('Gagal menghubungkan Google: ' + (err.message || 'Coba lagi'));
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setIsGoogleConnected(false);
  };

  // Track Actions
  const handleSaveTrack = (track: Track) => {
    setTracks((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      if (exists) {
        return prev.map((t) => (t.id === track.id ? track : t));
      }
      return [track, ...prev];
    });
  };

  const handleDeleteTrack = (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Lagu dari Katalog?',
      message: `Apakah Anda yakin ingin menghapus lagu "${track?.title || trackId}" dari database kurasi?`,
      action: () => {
        setTracks((prev) => prev.filter((t) => t.id !== trackId));
        setConfirmDialog((c) => ({ ...c, isOpen: false }));
      },
    });
  };

  const handleUpdateTrackStreams = (
    trackId: string,
    newStreams: number,
    newWeeklyStreams?: number
  ) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const oldTotal = t.streams;
          const weekly =
            newWeeklyStreams !== undefined
              ? newWeeklyStreams
              : Math.max(0, newStreams - oldTotal);
          const oldWeekly = t.weeklyStreams || Math.round(oldTotal * 0.06);
          const trend =
            oldWeekly > 0 ? ((weekly - oldWeekly) / oldWeekly) * 100 : 6.2;

          return {
            ...t,
            streams: newStreams,
            weeklyStreams: weekly,
            previousWeeklyStreams: oldTotal !== newStreams ? oldTotal : t.previousWeeklyStreams,
            weeklyTrendPercent: trend,
            updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          };
        }
        return t;
      })
    );
  };

  const [isBatchUpdating, setIsBatchUpdating] = useState(false);

  const handleBatchUpdateWeeklyStreams = async () => {
    setIsBatchUpdating(true);
    try {
      const updated = await batchSyncTracksFromScraper(tracks);
      if (Array.isArray(updated) && updated.length > 0) {
        setTracks(updated);
      }
    } catch (err) {
      console.error('Batch stream update error:', err);
    } finally {
      setIsBatchUpdating(false);
    }
  };

  // Artist Actions
  const handleSaveArtist = (artist: Artist, importedTracks?: Track[]) => {
    setArtists((prev) => {
      const exists = prev.some((a) => a.id === artist.id);
      if (exists) {
        return prev.map((a) => (a.id === artist.id ? artist : a));
      }
      return [artist, ...prev];
    });

    if (importedTracks && importedTracks.length > 0) {
      setTracks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const newTracks = importedTracks.filter((t) => !existingIds.has(t.id));
        return [...newTracks, ...prev];
      });
    }
  };

  const handleDeleteArtist = (artistId: string) => {
    const artist = artists.find((a) => a.id === artistId);
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Artis dari Database?',
      message: `Apakah Anda yakin ingin menghapus profil artis "${artist?.name || artistId}"?`,
      action: () => {
        setArtists((prev) => prev.filter((a) => a.id !== artistId));
        setConfirmDialog((c) => ({ ...c, isOpen: false }));
      },
    });
  };

  const handleImportArtistTracks = (artist: Artist) => {
    setImportModalUrl(artist.profileUrl || `https://open.spotify.com/artist/${artist.id}`);
    setIsImportModalOpen(true);
  };

  const handleBatchImportTracks = (newTracks: Track[]) => {
    setTracks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const filtered = newTracks.filter((t) => !existingIds.has(t.id));
      return [...filtered, ...prev];
    });
  };

  // Main Playlist Actions
  const handleSaveMainPlaylist = (pl: MainPlaylist, importedTracks?: Track[]) => {
    setMainPlaylists((prev) => {
      const exists = prev.some((p) => p.id === pl.id);
      if (exists) {
        return prev.map((p) => (p.id === pl.id ? pl : p));
      }
      return [pl, ...prev];
    });

    if (importedTracks && importedTracks.length > 0) {
      setTracks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const newTracks = importedTracks.filter((t) => !existingIds.has(t.id));
        return [...newTracks, ...prev];
      });
    }
  };

  const handleDeleteMainPlaylist = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Album / Discography?',
      message: 'Apakah Anda yakin ingin menghapus playlist utama ini?',
      action: () => {
        setMainPlaylists((prev) => prev.filter((p) => p.id !== id));
        setConfirmDialog((c) => ({ ...c, isOpen: false }));
      },
    });
  };

  // External Playlist Actions
  const handleSaveExternalPlaylist = (pl: ExternalPlaylist, importedTracks?: Track[]) => {
    setExternalPlaylists((prev) => {
      const exists = prev.some((p) => p.id === pl.id);
      if (exists) {
        return prev.map((p) => (p.id === pl.id ? pl : p));
      }
      return [pl, ...prev];
    });

    if (importedTracks && importedTracks.length > 0) {
      setTracks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const newTracks = importedTracks.filter((t) => !existingIds.has(t.id));
        return [...newTracks, ...prev];
      });
    }
  };

  const handleDeleteExternalPlaylist = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Playlist Eksternal?',
      message: 'Apakah Anda yakin ingin menghapus playlist eksternal ini dari pantauan?',
      action: () => {
        setExternalPlaylists((prev) => prev.filter((p) => p.id !== id));
        setConfirmDialog((c) => ({ ...c, isOpen: false }));
      },
    });
  };

  // Task Actions
  const handleAddTask = (task: CuratorTask) => {
    setCuratorTasks((prev) => [task, ...prev]);
  };

  const handleToggleTask = (taskId: string) => {
    setCuratorTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setCuratorTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Download Excel (.xlsx) 5-sheets
  const handleDownloadExcel = () => {
    exportToExcelFile(
      artists,
      tracks,
      mainPlaylists,
      externalPlaylists,
      `Katalog_Musik_Kurator_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // Total Streams hanya menghitung Total Streams dari lagu. Tidak boleh ada data ganda atau data dummy yang dihitung.
  const uniqueTracksMap = new Map<string, number>();
  tracks.forEach((t) => {
    const key = t.id ? t.id : `${(t.artist || '').toLowerCase().trim()}:::${(t.title || '').toLowerCase().trim()}`;
    if (!uniqueTracksMap.has(key)) {
      uniqueTracksMap.set(key, Number(t.streams) || 0);
    }
  });
  const totalStreamsAllTracks = Array.from(uniqueTracksMap.values()).reduce((sum, s) => sum + s, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        user={user}
        isGoogleConnected={isGoogleConnected}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenGoogleSync={() => setIsGoogleSyncModalOpen(true)}
        onDownloadExcel={handleDownloadExcel}
        trackCount={tracks.length}
        artistCount={artists.length}
        totalStreams={totalStreamsAllTracks}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow-md">
          <button
            type="button"
            onClick={() => setActiveTab('tracks')}
            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'tracks'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Sheet 2: Lagu ({tracks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('artists')}
            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'artists'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Sheet 1: Artis ({artists.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mainPlaylists')}
            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'mainPlaylists'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Disc className="w-4 h-4" />
            <span>Sheet 3: Playlist Utama (Discography)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('externalPlaylists')}
            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'externalPlaylists'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Sheet 4: Playlist Lain (Spotify / Mood)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Sheet 5: Tren & Analisis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scraperHub')}
            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'scraperHub'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                : 'text-purple-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>⚡ Scraper Gratis & Apps Script</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'tasks'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Google Tasks Kurasi ({curatorTasks.filter((t) => !t.completed).length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'tracks' && (
          <TracksTab
            tracks={tracks}
            onAddTrack={() => {
              setEditingTrack(null);
              setIsTrackModalOpen(true);
            }}
            onEditTrack={(track) => {
              setEditingTrack(track);
              setIsTrackModalOpen(true);
            }}
            onDeleteTrack={handleDeleteTrack}
            onUpdateTrackStreams={handleUpdateTrackStreams}
            onBatchUpdateWeeklyStreams={handleBatchUpdateWeeklyStreams}
            isBatchUpdating={isBatchUpdating}
          />
        )}

        {activeTab === 'artists' && (
          <ArtistsTab
            artists={artists}
            tracks={tracks}
            onAddArtist={() => {
              setEditingArtist(null);
              setIsArtistModalOpen(true);
            }}
            onEditArtist={(artist) => {
              setEditingArtist(artist);
              setIsArtistModalOpen(true);
            }}
            onDeleteArtist={handleDeleteArtist}
            onImportArtistTracks={handleImportArtistTracks}
          />
        )}

        {activeTab === 'mainPlaylists' && (
          <MainPlaylistsTab
            playlists={mainPlaylists}
            tracks={tracks}
            onAddPlaylist={() => {
              setEditingMainPlaylist(null);
              setInitialPlaylistUrl('');
              setPlaylistModalType('main');
              setIsPlaylistModalOpen(true);
            }}
            onAddPlaylistWithUrl={(url) => {
              setEditingMainPlaylist(null);
              setInitialPlaylistUrl(url);
              setPlaylistModalType('main');
              setIsPlaylistModalOpen(true);
            }}
            onEditPlaylist={(pl) => {
              setEditingMainPlaylist(pl);
              setInitialPlaylistUrl(pl.playlistUrl || '');
              setPlaylistModalType('main');
              setIsPlaylistModalOpen(true);
            }}
            onDeletePlaylist={handleDeleteMainPlaylist}
          />
        )}

        {activeTab === 'externalPlaylists' && (
          <ExternalPlaylistsTab
            playlists={externalPlaylists}
            onAddPlaylist={() => {
              setEditingExternalPlaylist(null);
              setInitialPlaylistUrl('');
              setPlaylistModalType('external');
              setIsPlaylistModalOpen(true);
            }}
            onAddPlaylistWithUrl={(url) => {
              setEditingExternalPlaylist(null);
              setInitialPlaylistUrl(url);
              setPlaylistModalType('external');
              setIsPlaylistModalOpen(true);
            }}
            onEditPlaylist={(pl) => {
              setEditingExternalPlaylist(pl);
              setInitialPlaylistUrl(pl.playlistUrl || '');
              setPlaylistModalType('external');
              setIsPlaylistModalOpen(true);
            }}
            onDeletePlaylist={handleDeleteExternalPlaylist}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            tracks={tracks}
            artists={artists}
            externalPlaylists={externalPlaylists}
          />
        )}

        {activeTab === 'scraperHub' && <ScraperHubTab />}

        {activeTab === 'tasks' && (
          <TasksTab
            tasks={curatorTasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            isGoogleConnected={isGoogleConnected}
            onRequireAuth={handleLogin}
          />
        )}
      </main>

      {/* Modals */}
      <TrackModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        onSave={handleSaveTrack}
        initialTrack={editingTrack}
        existingArtists={artists.map((a) => a.name)}
      />

      <ArtistModal
        isOpen={isArtistModalOpen}
        onClose={() => setIsArtistModalOpen(false)}
        onSave={handleSaveArtist}
        initialArtist={editingArtist}
      />

      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        type={playlistModalType}
        onSaveMain={handleSaveMainPlaylist}
        onSaveExternal={handleSaveExternalPlaylist}
        initialMain={editingMainPlaylist}
        initialExternal={editingExternalPlaylist}
        availableTracks={tracks}
        availableArtists={artists}
        initialUrl={initialPlaylistUrl}
      />

      <ImportTracksModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportTracks={handleBatchImportTracks}
        existingTracks={tracks}
        artists={artists}
        mainPlaylists={mainPlaylists}
        externalPlaylists={externalPlaylists}
        initialUrl={importModalUrl}
      />

      <GoogleSyncModal
        isOpen={isGoogleSyncModalOpen}
        onClose={() => setIsGoogleSyncModalOpen(false)}
        artists={artists}
        tracks={tracks}
        mainPlaylists={mainPlaylists}
        externalPlaylists={externalPlaylists}
        isGoogleConnected={isGoogleConnected}
        onRequireAuth={handleLogin}
      />

      {/* Mandatory User Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={true}
        confirmLabel="Hapus Data"
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog((c) => ({ ...c, isOpen: false }))}
      />
    </div>
  );
}

import * as XLSX from 'xlsx';
import { Track, Artist, MainPlaylist, ExternalPlaylist } from '../types/curator';

export const exportToExcelFile = (
  artists: Artist[],
  tracks: Track[],
  mainPlaylists: MainPlaylist[],
  externalPlaylists: ExternalPlaylist[],
  fileName = 'Katalog_Kurator_Musik.xlsx'
) => {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Artis
  const artistData = artists.map((a) => ({
    'ID Artis': a.id,
    'Nama Artis': a.name,
    'Genre Utama': a.primaryGenre,
    'Sub-Genre': a.subGenres.join(', '),
    'Popularitas (0-100)': a.popularity,
    'Total Stream': a.totalStreams,
    'Monthly Listeners': a.monthlyListeners,
    'Followers (Pengikut)': a.followers || 285,
    'Status Kurasi': a.status,
    'Tautan Profil': a.profileUrl,
    'Catatan Kurator': a.curatorNotes,
  }));
  const wsArtists = XLSX.utils.json_to_sheet(artistData);
  XLSX.utils.book_append_sheet(wb, wsArtists, 'Artis');

  // 2. Sheet Lagu
  const trackData = tracks.map((t) => ({
    'ID Lagu': t.id,
    'Judul Lagu': t.title,
    'Artis': t.artist,
    'Genre': t.genre,
    'Tahun Rilis': t.releaseYear,
    'Durasi': t.duration,
    'Platform': t.platform,
    'Tautan Streaming': t.streamingUrl,
    'Total Streams (Kumulatif)': t.streams,
    'Stream Mingguan (Weekly Streams)': t.weeklyStreams ?? (t.streams - t.previousWeeklyStreams),
    'Stream Minggu Lalu': t.previousWeeklyStreams,
    'Tren Mingguan (%)': Number(t.weeklyTrendPercent.toFixed(1)),
    'Popularitas (0-100)': t.popularity,
    'Rating Kurator (1-5)': t.curatorRating,
    'Mood / Vibe': t.mood,
    'Catatan Kurator': t.curatorNotes,
    'Terakhir Diperbarui': t.updatedAt,
  }));
  const wsTracks = XLSX.utils.json_to_sheet(trackData);
  XLSX.utils.book_append_sheet(wb, wsTracks, 'Lagu');

  // 3. Sheet Playlist Utama
  const mainPlaylistData = mainPlaylists.map((p) => ({
    'ID Playlist': p.id,
    'Nama Album / Discography': p.title,
    'Artis': p.artist,
    'Tipe Rilis': p.type,
    'Tahun': p.releaseYear,
    'Jumlah Lagu': p.totalTracks,
    'Total Durasi': p.totalDuration,
    'Daftar ID Track': p.trackIds.join(', '),
    'Tautan URL': p.playlistUrl || '',
    'Catatan Kurasi': p.notes,
  }));
  const wsMainPlaylists = XLSX.utils.json_to_sheet(mainPlaylistData);
  XLSX.utils.book_append_sheet(wb, wsMainPlaylists, 'Playlist Utama');

  // 4. Sheet Playlist Lain
  const extPlaylistData = externalPlaylists.map((ep) => ({
    'ID': ep.id,
    'Nama Playlist': ep.title,
    'Kurator / Pembuat': ep.curatedBy,
    'Platform': ep.platform,
    'Pengikut (Followers)': ep.followers,
    'Estimasi Stream Mingguan': ep.estimatedWeeklyStreams,
    'Genre Dominan': ep.primaryGenre,
    'Mood / Suasana': ep.mood,
    'Tautan Playlist': ep.playlistUrl,
    'Frekuensi Sync': ep.syncFrequency,
    'Catatan Evaluasi': ep.curatorNotes,
  }));
  const wsExtPlaylists = XLSX.utils.json_to_sheet(extPlaylistData);
  XLSX.utils.book_append_sheet(wb, wsExtPlaylists, 'Playlist Lain');

  // 5. Sheet Tren & Analisis
  const analysisData = [
    { 'Kategori': 'Total Lagu Terkatalog', 'Nilai': tracks.length, 'Keterangan': 'Item Lagu' },
    { 'Kategori': 'Total Stream Akumulatif', 'Nilai': tracks.reduce((acc, t) => acc + t.streams, 0), 'Keterangan': 'Streams' },
    { 'Kategori': 'Rata-Rata Popularitas', 'Nilai': Math.round(tracks.reduce((acc, t) => acc + t.popularity, 0) / (tracks.length || 1)), 'Keterangan': 'Skala 0-100' },
    { 'Kategori': 'Rata-Rata Rating Kurator', 'Nilai': (tracks.reduce((acc, t) => acc + t.curatorRating, 0) / (tracks.length || 1)).toFixed(2), 'Keterangan': 'Skala 1-5 Bintang' },
    { 'Kategori': 'Lagu dengan Pertumbuhan Tertinggi', 'Nilai': tracks.slice().sort((a, b) => b.weeklyTrendPercent - a.weeklyTrendPercent)[0]?.title || '-', 'Keterangan': `${tracks.slice().sort((a, b) => b.weeklyTrendPercent - a.weeklyTrendPercent)[0]?.weeklyTrendPercent.toFixed(1) || 0}% MoM/WoW` },
  ];
  const wsAnalysis = XLSX.utils.json_to_sheet(analysisData);
  XLSX.utils.book_append_sheet(wb, wsAnalysis, 'Tren & Analisis');

  // Download browser trigger
  XLSX.writeFile(wb, fileName);
};

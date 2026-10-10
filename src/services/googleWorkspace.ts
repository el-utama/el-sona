import { Track, Artist, MainPlaylist, ExternalPlaylist } from '../types/curator';
import { getAccessToken } from './firebaseAuth';

export interface SpreadsheetExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

export const createCuratorSpreadsheet = async (
  title: string,
  artists: Artist[],
  tracks: Track[],
  mainPlaylists: MainPlaylist[],
  externalPlaylists: ExternalPlaylist[]
): Promise<SpreadsheetExportResult> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Autentikasi Google belum aktif. Silakan masuk dengan Akun Google terlebih dahulu.');
  }

  // 1. Create spreadsheet structure with 5 requested sheets
  const requestBody = {
    properties: {
      title: title || `Katalog Musik & Kurasi Digital - ${new Date().toLocaleDateString('id-ID')}`,
    },
    sheets: [
      { properties: { title: 'Artis', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Lagu', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Playlist Utama', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Playlist Lain', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Tren & Analisis', gridProperties: { frozenRowCount: 1 } } },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Gagal membuat Google Sheet: ${errText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  // 2. Prepare value data for each of the 5 sheets
  const artistValues = [
    ['ID Artis', 'Nama Artis', 'Genre Utama', 'Sub-Genre', 'Popularitas (0-100)', 'Total Stream', 'Monthly Listeners', 'Followers (Pengikut)', 'Status Kurasi', 'Tautan Profil', 'Catatan Kurator'],
    ...artists.map((a) => [
      a.id,
      a.name,
      a.primaryGenre,
      a.subGenres.join(', '),
      a.popularity,
      a.totalStreams,
      a.monthlyListeners,
      a.followers || 285,
      a.status,
      a.profileUrl,
      a.curatorNotes,
    ]),
  ];

  const trackValues = [
    [
      'ID Lagu',
      'Judul Lagu',
      'Artis',
      'Genre',
      'Tahun Rilis',
      'Durasi',
      'Platform',
      'Tautan Streaming',
      'Total Streams (Kumulatif)',
      'Stream Mingguan (Terakhir 7 Hari)',
      'Stream Minggu Lalu',
      'Tren Mingguan (%)',
      'Popularitas (0-100)',
      'Rating Kurator (1-5)',
      'Mood / Vibe',
      'Catatan Kurator',
      'Terakhir Diperbarui',
    ],
    ...tracks.map((t) => [
      t.id,
      t.title,
      t.artist,
      t.genre,
      t.releaseYear,
      t.duration,
      t.platform,
      t.streamingUrl,
      t.streams,
      t.weeklyStreams ?? (t.streams - t.previousWeeklyStreams),
      t.previousWeeklyStreams,
      `${t.weeklyTrendPercent > 0 ? '+' : ''}${t.weeklyTrendPercent.toFixed(1)}%`,
      t.popularity,
      t.curatorRating,
      t.mood,
      t.curatorNotes,
      t.updatedAt,
    ]),
  ];

  const mainPlaylistValues = [
    ['ID Playlist', 'Nama Album / Discography', 'Artis', 'Tipe Rilis', 'Tahun', 'Jumlah Lagu', 'Total Durasi', 'Daftar ID Track', 'Tautan URL Spotify', 'Catatan Kurasi'],
    ...mainPlaylists.map((p) => [
      p.id,
      p.title,
      p.artist,
      p.type,
      p.releaseYear,
      p.totalTracks,
      p.totalDuration,
      p.trackIds.join(', '),
      p.playlistUrl || '',
      p.notes,
    ]),
  ];

  const externalPlaylistValues = [
    ['ID', 'Nama Playlist', 'Kurator / Pembuat', 'Platform', 'Pengikut (Followers)', 'Estimasi Stream Mingguan', 'Genre Dominan', 'Mood / Suasana', 'Tautan Playlist', 'Frekuensi Sync', 'Catatan Evaluasi'],
    ...externalPlaylists.map((ep) => [
      ep.id,
      ep.title,
      ep.curatedBy,
      ep.platform,
      ep.followers,
      ep.estimatedWeeklyStreams,
      ep.primaryGenre,
      ep.mood,
      ep.playlistUrl,
      ep.syncFrequency,
      ep.curatorNotes,
    ]),
  ];

  // Sheet 5: Tren & Analisis (Formulas and snapshot summaries)
  const analysisValues = [
    ['RINGKASAN METRIK KURASI MUSIK', '', '', ''],
    ['Total Lagu Terkatalog', '=COUNTA(Lagu!A2:A)', '', ''],
    ['Total Stream Katalog', '=SUM(Lagu!I2:I)', '', ''],
    ['Rata-Rata Popularitas Lagu', '=AVERAGE(Lagu!L2:L)', '', ''],
    ['Rata-Rata Rating Kurator', '=AVERAGE(Lagu!M2:M)', '', ''],
    ['', '', '', ''],
    ['PERFORMA STREAM MINGGUAN (TOP TRACKS)', 'Genre', 'Total Stream Saat Ini', 'Pertumbuhan (%)', 'Status Rekomendasi'],
    ...tracks.slice(0, 10).map((t) => [
      t.title + ' - ' + t.artist,
      t.genre,
      t.streams,
      `${t.weeklyTrendPercent > 0 ? '+' : ''}${t.weeklyTrendPercent.toFixed(1)}%`,
      t.weeklyTrendPercent >= 5 ? '🔥 High Momentum (Pitch ke Playlist Utama)' : t.weeklyTrendPercent >= 0 ? '✅ Stabil' : '⚠️ Evaluasi Ulang',
    ]),
  ];

  // 3. Batch Update values into spreadsheet
  const batchData = [
    { range: 'Artis!A1', values: artistValues },
    { range: 'Lagu!A1', values: trackValues },
    { range: 'Playlist Utama!A1', values: mainPlaylistValues },
    { range: 'Playlist Lain!A1', values: externalPlaylistValues },
    { range: 'Tren & Analisis!A1', values: analysisValues },
  ];

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: batchData,
      }),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    console.error('Failed to populate Google Sheet data:', errText);
    throw new Error(`Gagal mengisi data Google Sheet: ${errText}`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
  };
};

export const syncToExistingSpreadsheet = async (
  spreadsheetId: string,
  artists: Artist[],
  tracks: Track[],
  mainPlaylists: MainPlaylist[],
  externalPlaylists: ExternalPlaylist[]
): Promise<void> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Autentikasi Google belum aktif.');
  }

  const artistValues = [
    ['ID Artis', 'Nama Artis', 'Genre Utama', 'Sub-Genre', 'Popularitas (0-100)', 'Total Stream', 'Monthly Listeners', 'Followers (Pengikut)', 'Status Kurasi', 'Tautan Profil', 'Catatan Kurator'],
    ...artists.map((a) => [
      a.id,
      a.name,
      a.primaryGenre,
      a.subGenres.join(', '),
      a.popularity,
      a.totalStreams,
      a.monthlyListeners,
      a.followers || 285,
      a.status,
      a.profileUrl,
      a.curatorNotes,
    ]),
  ];

  const trackValues = [
    [
      'ID Lagu',
      'Judul Lagu',
      'Artis',
      'Genre',
      'Tahun Rilis',
      'Durasi',
      'Platform',
      'Tautan Streaming',
      'Total Streams (Kumulatif)',
      'Stream Mingguan (Terakhir 7 Hari)',
      'Stream Minggu Lalu',
      'Tren Mingguan (%)',
      'Popularitas (0-100)',
      'Rating Kurator (1-5)',
      'Mood / Vibe',
      'Catatan Kurator',
      'Terakhir Diperbarui',
    ],
    ...tracks.map((t) => [
      t.id,
      t.title,
      t.artist,
      t.genre,
      t.releaseYear,
      t.duration,
      t.platform,
      t.streamingUrl,
      t.streams,
      t.weeklyStreams ?? (t.streams - t.previousWeeklyStreams),
      t.previousWeeklyStreams,
      `${t.weeklyTrendPercent > 0 ? '+' : ''}${t.weeklyTrendPercent.toFixed(1)}%`,
      t.popularity,
      t.curatorRating,
      t.mood,
      t.curatorNotes,
      t.updatedAt,
    ]),
  ];

  const mainPlaylistValues = [
    ['ID Playlist', 'Nama Album / Discography', 'Artis', 'Tipe Rilis', 'Tahun', 'Jumlah Lagu', 'Total Durasi', 'Daftar ID Track', 'Tautan URL Spotify', 'Catatan Kurasi'],
    ...mainPlaylists.map((p) => [
      p.id,
      p.title,
      p.artist,
      p.type,
      p.releaseYear,
      p.totalTracks,
      p.totalDuration,
      p.trackIds.join(', '),
      p.playlistUrl || '',
      p.notes,
    ]),
  ];

  const externalPlaylistValues = [
    ['ID', 'Nama Playlist', 'Kurator / Pembuat', 'Platform', 'Pengikut (Followers)', 'Estimasi Stream Mingguan', 'Genre Dominan', 'Mood / Suasana', 'Tautan Playlist', 'Frekuensi Sync', 'Catatan Evaluasi'],
    ...externalPlaylists.map((ep) => [
      ep.id,
      ep.title,
      ep.curatedBy,
      ep.platform,
      ep.followers,
      ep.estimatedWeeklyStreams,
      ep.primaryGenre,
      ep.mood,
      ep.playlistUrl,
      ep.syncFrequency,
      ep.curatorNotes,
    ]),
  ];

  const batchData = [
    { range: 'Artis!A1:J' + (artists.length + 1), values: artistValues },
    { range: 'Lagu!A1:P' + (tracks.length + 1), values: trackValues },
    { range: 'Playlist Utama!A1:J' + (mainPlaylists.length + 1), values: mainPlaylistValues },
    { range: 'Playlist Lain!A1:K' + (externalPlaylists.length + 1), values: externalPlaylistValues },
  ];

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: batchData,
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.text();
    throw new Error(`Gagal menyinkronkan data ke sheet: ${err}`);
  }
};

// Google Tasks API functions
export interface GoogleTaskList {
  id: string;
  title: string;
}

export const getGoogleTaskLists = async (): Promise<GoogleTaskList[]> => {
  const token = await getAccessToken();
  if (!token) return [];

  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.error('Failed to list tasks lists:', await res.text());
    return [];
  }

  const data = await res.json();
  return data.items || [];
};

export const createGoogleTask = async (
  taskListId: string = '@default',
  task: { title: string; notes?: string; due?: string }
): Promise<any> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Autentikasi Google belum aktif.');
  }

  const body: any = {
    title: task.title,
  };
  if (task.notes) body.notes = task.notes;
  if (task.due) {
    // RFC 3339 timestamp
    body.due = new Date(task.due).toISOString();
  }

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gagal membuat tugas di Google Tasks: ${err}`);
  }

  return await res.json();
};

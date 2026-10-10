export interface WeeklyStreamPoint {
  week: string; // e.g. "W1", "W2", "W3", "W4", "W5", "W6"
  streams: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  releaseYear: number;
  duration: string; // MM:SS
  durationSeconds: number;
  streamingUrl: string;
  platform: 'Spotify' | 'YouTube' | 'Apple Music' | 'SoundCloud' | 'Other';
  streams: number; // Current total cumulative streams
  weeklyStreams: number; // Weekly stream volume (streams in the last 7 days)
  previousWeeklyStreams: number;
  weeklyTrendPercent: number; // calculated % change
  popularity: number; // 0 - 100
  curatorRating: number; // 1 - 5 stars
  curatorNotes: string;
  mood: string;
  coverUrl?: string;
  audioPreviewUrl?: string;
  updatedAt: string;
}

export interface Artist {
  id: string;
  name: string;
  primaryGenre: string;
  subGenres: string[];
  popularity: number; // 0 - 100
  totalStreams: number;
  monthlyListeners: number;
  followers: number;
  profileUrl: string;
  curatorNotes: string;
  status: 'Rising' | 'Established' | 'Trending' | 'Underground' | 'Watchlist';
  photoUrl?: string;
  trackCount: number;
}

export interface MainPlaylist {
  id: string;
  title: string;
  artist: string;
  type: 'Discography' | 'Album' | 'EP' | 'Essentials' | 'Live Session';
  releaseYear: number;
  totalTracks: number;
  totalDuration: string;
  trackIds: string[];
  notes: string;
  coverUrl?: string;
  playlistUrl?: string;
}

export interface ExternalPlaylist {
  id: string;
  title: string;
  curatedBy: string; // e.g., "Spotify Editorial", "Indie Music Indo", "User Curator"
  platform: 'Spotify Editorial' | 'Spotify Community' | 'Apple Music' | 'YouTube Mix';
  playlistUrl: string;
  followers: number;
  estimatedWeeklyStreams: number;
  primaryGenre: string;
  mood: string;
  trackInclusionCount: number;
  curatorNotes: string;
  syncFrequency: 'Harian' | 'Mingguan' | 'Bulanan';
  coverUrl?: string;
}

export interface WeeklyTrendData {
  weekLabel: string;
  totalStreams: number;
  topTrack: string;
  growthRate: number;
}

export interface CuratorTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low';
  category: 'Review Lagu' | 'Update Stream' | 'Playlist Pitch' | 'Riset Artis';
}

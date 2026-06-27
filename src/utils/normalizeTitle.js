const TYPE_MAP = {
  movie: 'MOVIE',
  tvSeries: 'TV_SERIES',
  tvMiniSeries: 'TV_MINI_SERIES',
  tvSpecial: 'TV_SPECIAL',
  tvMovie: 'TV_MOVIE',
  short: 'SHORT',
  video: 'VIDEO',
  videoGame: 'VIDEO_GAME',
};

export const normalizeType = (type) => {
  if (!type) return 'MOVIE';
  if (TYPE_MAP[type]) return TYPE_MAP[type];
  return type.toUpperCase().replace(/-/g, '_');
};

export const normalizeTitle = (raw) => {
  if (!raw?.id) return null;

  const posterUrl = raw.primaryImage?.url;
  const backdropUrl = raw.backdropImage?.url || posterUrl;

  return {
    id: raw.id,
    type: normalizeType(raw.type),
    isAdult: raw.isAdult ?? false,
    primaryTitle: raw.primaryTitle || 'Untitled',
    originalTitle: raw.originalTitle || raw.primaryTitle || 'Untitled',
    primaryImage: raw.primaryImage || (posterUrl ? { url: posterUrl, width: 400, height: 600 } : null),
    backdropImage: backdropUrl
      ? { url: backdropUrl, width: 1200, height: 675, type: 'still_frame' }
      : null,
    startYear: raw.startYear ?? null,
    endYear: raw.endYear ?? null,
    runtimeSeconds: raw.runtimeSeconds ?? null,
    genres: raw.genres || [],
    rating: {
      aggregateRating: raw.rating?.aggregateRating ?? 0,
      voteCount: raw.rating?.voteCount ?? 0,
    },
    metacritic: raw.metacritic || null,
    plot: raw.plot || '',
    directors: raw.directors || [],
    stars: raw.stars || [],
    source: 'api',
  };
};

export default normalizeTitle;

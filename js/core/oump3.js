/**
 * M-Core OUMP3 Container Module
 * Fast binary header parser (first 64 KB Range) and full JSZip container packager/extractor.
 */

/* ==========================================================================
   Fast Binary Header Parser (Range: bytes=0-65535, NO JSZip)
   ========================================================================== */
export function parseOump3HeaderFast(arrayBuffer) {
  try {
    const uint8 = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const textChunk = decoder.decode(uint8);

    // Ищем сигнатуру JSON метаданных в первых 64 КБ
    const titleIdx = textChunk.indexOf('{"title"');
    const altIdx = textChunk.indexOf('{"artist"');
    const startIdx = titleIdx !== -1 ? titleIdx : altIdx;

    if (startIdx === -1) {
      console.warn('[oump3] header.json signature not found in first 64KB chunk.');
      return null;
    }

    // Ищем закрывающую скобку JSON объекта
    let depth = 0;
    let endIdx = -1;

    for (let i = startIdx; i < textChunk.length; i++) {
      const char = textChunk[i];
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }

    if (endIdx === -1) {
      console.warn('[oump3] Unclosed JSON object in first 64KB chunk.');
      return null;
    }

    const jsonStr = textChunk.slice(startIdx, endIdx);
    const meta = JSON.parse(jsonStr);

    return {
      title: meta.title || 'Безымянный трек',
      artist: meta.artist || 'Неизвестный исполнитель',
      genres: Array.isArray(meta.genres) ? meta.genres : [],
      duration: Number(meta.duration) || 0,
      hasLyrics: typeof meta.hasLyrics === 'boolean' ? meta.hasLyrics : false,
      thumbBase64: meta.thumbBase64 || null,
      version: meta.version || '1.0'
    };
  } catch (err) {
    console.error('[oump3] Fast binary header parse failed:', err);
    return null;
  }
}

/* ==========================================================================
   Full Unpacker (JSZip.loadAsync)
   ========================================================================== */
export async function unpackOump3Full(arrayBufferOrBlob) {
  if (typeof window.JSZip === 'undefined') {
    throw new Error('JSZip library is not loaded.');
  }

  const zip = await window.JSZip.loadAsync(arrayBufferOrBlob);

  // 1. Meta / Header
  let meta = null;
  const headerFile = zip.file('header.json') || zip.file('meta.json');
  if (headerFile) {
    const jsonStr = await headerFile.async('text');
    meta = JSON.parse(jsonStr);
  }

  // 2. Audio file
  let audioBlob = null;
  const audioFile = zip.file('audio.mp3') || zip.file('audio.wav') || zip.file(/audio\.(mp3|wav|ogg|m4a)$/i)[0];
  if (audioFile) {
    const ext = audioFile.name.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';
    audioBlob = await audioFile.async('blob');
    audioBlob = new Blob([audioBlob], { type: ext });
  }

  // 3. Full Cover
  let coverBlob = null;
  const coverFile = zip.file('cover.jpg') || zip.file('cover.png') || zip.file(/cover\.(jpg|jpeg|png|webp)$/i)[0];
  if (coverFile) {
    const ext = coverFile.name.endsWith('.png') ? 'image/png' : 'image/jpeg';
    coverBlob = await coverFile.async('blob');
    coverBlob = new Blob([coverBlob], { type: ext });
  }

  // 4. Lyrics
  let lyricsText = '';
  const lyricsFile = zip.file('lyrics.lrc') || zip.file(/lyrics\.(lrc|txt)$/i)[0];
  if (lyricsFile) {
    lyricsText = await lyricsFile.async('text');
  }

  return {
    meta: meta || {},
    audioBlob,
    coverBlob,
    lyricsText
  };
}

/* ==========================================================================
   Container Builder (.oump3)
   ========================================================================== */
export async function buildOump3Container({
  title,
  artist,
  genres = [],
  duration = 0,
  hasLyrics = false,
  thumbBase64 = null,
  audioBlob,
  coverBlob = null,
  lyricsText = ''
}) {
  if (typeof window.JSZip === 'undefined') {
    throw new Error('JSZip library is not loaded.');
  }

  const zip = new window.JSZip();

  const meta = {
    title: title.trim(),
    artist: artist.trim(),
    genres: Array.isArray(genres) ? genres : [],
    duration: Math.round(duration),
    version: '1.0',
    hasLyrics: !!lyricsText || hasLyrics,
    thumbBase64: thumbBase64 || null
  };

  const metaString = JSON.stringify(meta, null, 2);

  // КРИТИЧЕСКОЕ ТРЕБОВАНИЕ: header.json пишется ПЕРВЫМ файлом методом STORE (без сжатия)!
  zip.file('header.json', metaString, {
    compression: 'STORE',
    date: new Date()
  });

  // Audio file
  if (audioBlob) {
    const audioName = audioBlob.type.includes('wav') ? 'audio.wav' : 'audio.mp3';
    zip.file(audioName, audioBlob, {
      binary: true,
      date: new Date()
    });
  }

  // Cover
  if (coverBlob) {
    const coverName = coverBlob.type.includes('png') ? 'cover.png' : 'cover.jpg';
    zip.file(coverName, coverBlob, {
      binary: true,
      date: new Date()
    });
  }

  // Lyrics
  if (lyricsText && lyricsText.trim()) {
    zip.file('lyrics.lrc', lyricsText.trim(), {
      compression: 'STORE',
      date: new Date()
    });
  }

  // Generate output zip blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  return zipBlob;
}

/* ==========================================================================
   Playlist Container (.oulist)
   ========================================================================== */
export async function buildOulistContainer(playlist) {
  const payload = {
    type: 'ouMusic_playlist',
    version: '1.0',
    id: playlist.id,
    name: playlist.name,
    description: playlist.description || '',
    coverBase64: playlist.coverBase64 || null,
    tracks: playlist.trackIds || [],
    exportedAt: new Date().toISOString()
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  return new Blob([jsonStr], { type: 'application/json' });
}

export async function unpackOulistContainer(fileOrBlob) {
  const text = await fileOrBlob.text();
  const data = JSON.parse(text);

  if (data.type !== 'ouMusic_playlist') {
    throw new Error('Неверный формат контейнера плейлиста .oulist');
  }

  return {
    name: data.name || 'Импортированный плейлист',
    description: data.description || '',
    coverBase64: data.coverBase64 || null,
    trackIds: Array.isArray(data.tracks) ? data.tracks : []
  };
}

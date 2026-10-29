import { getCachedCatalog } from './github.js';

let verifiedDatabase = new Map(); // name.toLowerCase() -> { avatar, banner, verified: bool }

export async function loadArtistsVerification() {
  try {
    const res = await fetch('./artists.txt', { cache: 'no-cache' });
    if (!res.ok) return;
    const text = await res.text();
    const lines = text.split('\n');

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const parts = trimmed.split(' - ').map((p) => p.trim());
      if (parts.length >= 4) {
        const [idOrName, avatar, banner, isVerified] = parts;
        verifiedDatabase.set(idOrName.toLowerCase(), {
          avatar: avatar || 'assets/default-cover.svg',
          banner: banner || 'assets/default-cover.svg',
          verified: isVerified === '1'
        });
      }
    });
  } catch (e) {
    console.warn('[Artists] Could not load artists.txt:', e);
  }
}

export function isArtistVerified(artistName) {
  if (!artistName) return false;
  const record = verifiedDatabase.get(artistName.trim().toLowerCase());
  return record ? record.verified : false;
}

export function getArtistProfileData(artistName) {
  if (!artistName) return null;
  return verifiedDatabase.get(artistName.trim().toLowerCase()) || null;
}

export function splitArtists(artistString) {
  if (!artistString) return [];
  return artistString.split(/,|&|feat\.|ft\./i).map((a) => a.trim()).filter(Boolean);
}

export function renderArtistScreen(artistName, onTrackSelect, onPlayAll) {
  const catalog = getCachedCatalog();
  const cleanName = artistName.trim();
  const profile = getArtistProfileData(cleanName);

  const nameTitle = document.getElementById('artist-name-title');
  const bannerImg = document.getElementById('artist-banner-img');
  const avatarImg = document.getElementById('artist-avatar-img');
  const verifiedBadge = document.getElementById('artist-verified-badge');
  const countLabel = document.getElementById('artist-tracks-counter');
  const tracksContainer = document.getElementById('artist-tracks-list');
  const playAllBtn = document.getElementById('artist-play-all-btn');
  const shareBtn = document.getElementById('artist-share-btn');

  if (nameTitle) nameTitle.textContent = cleanName;

  if (bannerImg) {
    bannerImg.src = profile?.banner || 'assets/default-cover.svg';
  }
  if (avatarImg) {
    avatarImg.src = profile?.avatar || 'assets/default-cover.svg';
  }

  const isVer = profile ? profile.verified : false;
  if (verifiedBadge) {
    verifiedBadge.style.display = isVer ? 'inline-flex' : 'none';
  }

  // Find all tracks involving this artist
  const artistTracks = catalog.filter((t) => {
    if (!t.artist) return false;
    const parts = splitArtists(t.artist);
    return parts.some((p) => p.toLowerCase() === cleanName.toLowerCase());
  });

  if (countLabel) {
    countLabel.textContent = `${artistTracks.length} трек(ов) на платформе`;
  }

  if (playAllBtn) {
    playAllBtn.onclick = () => {
      if (artistTracks.length > 0 && onPlayAll) {
        onPlayAll(artistTracks);
      }
    };
  }

  if (shareBtn) {
    shareBtn.onclick = () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}#artist=${encodeURIComponent(cleanName)}`;
      const text = `Послушай треки музыканта ${cleanName} в ouMusic: ${shareUrl}`;

      if (navigator.share) {
        navigator.share({ title: cleanName, text, url: shareUrl }).catch(() => {});
      } else {
        navigator.clipboard.writeText(text);
        alert('Ссылка на артиста скопирована в буфер обмена!');
      }
    };
  }

  // Render tracks
  if (tracksContainer) {
    tracksContainer.innerHTML = '';
    artistTracks.forEach((track) => {
      const row = document.createElement('div');
      row.className = 'track-row';
      row.setAttribute('data-track-id', track.id);

      row.innerHTML = `
        <div class="track-cover-wrap">
          <img class="track-cover-img" src="${track.thumbBase64 || 'assets/default-cover.svg'}" alt="">
        </div>
        <div class="track-info">
          <div class="track-title">${track.title}</div>
          <div class="track-artist">${track.artist}</div>
        </div>
      `;

      row.addEventListener('click', () => {
        if (onTrackSelect) onTrackSelect(track);
      });

      tracksContainer.appendChild(row);
    });
  }
}

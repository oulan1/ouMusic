export const DICTIONARY = {
  ru: {
    nav_home: 'Главная',
    nav_wave: 'Моя Волна',
    nav_library: 'Библиотека',
    nav_studio: 'Моя Студия',
    nav_profile: 'Мой профиль',
    nav_settings: 'Настройки',
    search_placeholder: 'Поиск треков, артистов...',
    wave_title: 'Моя Волна',
    wave_subtitle: 'Бесконечный поток под ваше настроение',
    wave_mood_label: 'Настроение и занятие:',
    mood_all: 'Все',
    mood_work: 'Для работы',
    mood_rest: 'Отдых',
    mood_sleep: 'Засыпаю',
    mood_workout: 'Тренировка',
    mood_road: 'В дорогу',
    mood_energy: 'Бодрость',
    mood_melancholy: 'Меланхолия',
    wave_character_label: 'Характер:',
    char_any: 'Любой',
    char_familiar: 'Знакомое',
    char_unfamiliar: 'Незнакомое',
    char_forgotten: 'Забытое',
    char_popular: 'Популярное',
    wave_genre_label: 'Фильтр по жанру:',
    wave_sphere_subtitle: 'Музыкальная сфера адаптируется под ритм музыки',
    feed_title: 'Лента треков',
    manual_tracks_title: 'Добавлено вручную',
    manual_tracks_subtitle: 'Треки, загруженные вами локально. Хранятся вечно в IndexedDB и доступны 100% оффлайн.',
    btn_upload_oump3: 'Загрузить свой .oump3',
    tab_playlists: 'Плейлисты',
    tab_likes: 'Понравившиеся',
    tab_downloads: 'Скачанные',
    btn_create_playlist: 'Создать плейлист',
    btn_import_oulist: 'Импорт .oulist',
    btn_tunemymusic: 'TuneMyMusic',
    stat_month: 'За этот месяц',
    stat_total: 'За всё время',
    btn_year_recap: 'Ваши итоги года',
    achievements_title: 'Достижения',
    backup_title: 'Резервная копия',
    btn_export_backup: 'Экспорт профиля (JSON)',
    btn_import_backup: 'Импорт профиля',
    history_title: 'История прослушиваний',
    settings_appearance: 'Внешний вид',
    settings_audio: 'Аудиодвижок M-Core',
    vocal_remover_beta: 'Минусовка (BETA)',
    share_track_text: 'Послушай этот трек в ouMusic: {artist} — {title}',
    share_artist_text: 'Послушай треки музыканта {artist} в ouMusic',
    verified_tooltip: 'Данный музыкант официально подтвердил свою страницу на ouMusic'
  },
  en: {
    nav_home: 'Home',
    nav_wave: 'My Wave',
    nav_library: 'Library',
    nav_studio: 'My Studio',
    nav_profile: 'My Profile',
    nav_settings: 'Settings',
    search_placeholder: 'Search tracks, artists...',
    wave_title: 'My Wave',
    wave_subtitle: 'Endless stream tailored to your mood',
    wave_mood_label: 'Mood & Activity:',
    mood_all: 'All',
    mood_work: 'Work',
    mood_rest: 'Chill',
    mood_sleep: 'Sleep',
    mood_workout: 'Workout',
    mood_road: 'Road',
    mood_energy: 'Energy',
    mood_melancholy: 'Melancholy',
    wave_character_label: 'Character:',
    char_any: 'Any',
    char_familiar: 'Familiar',
    char_unfamiliar: 'Unfamiliar',
    char_forgotten: 'Forgotten',
    char_popular: 'Popular',
    wave_genre_label: 'Filter by genre:',
    wave_sphere_subtitle: 'Musical sphere adapts to the rhythm of sound',
    feed_title: 'Tracks Feed',
    manual_tracks_title: 'Added Manually',
    manual_tracks_subtitle: 'Tracks uploaded locally. Stored permanently in IndexedDB and available 100% offline.',
    btn_upload_oump3: 'Upload .oump3 track',
    tab_playlists: 'Playlists',
    tab_likes: 'Liked Songs',
    tab_downloads: 'Downloaded',
    btn_create_playlist: 'Create Playlist',
    btn_import_oulist: 'Import .oulist',
    btn_tunemymusic: 'TuneMyMusic',
    stat_month: 'This month',
    stat_total: 'All time',
    btn_year_recap: 'Your Year in Music',
    achievements_title: 'Achievements',
    backup_title: 'Backup & Restore',
    btn_export_backup: 'Export Profile (JSON)',
    btn_import_backup: 'Import Profile',
    history_title: 'Listening History',
    settings_appearance: 'Appearance',
    settings_audio: 'M-Core Audio Engine',
    vocal_remover_beta: 'Vocal Remover (BETA)',
    share_track_text: 'Listen to this track on ouMusic: {artist} — {title}',
    share_artist_text: 'Listen to {artist} on ouMusic',
    verified_tooltip: 'This musician is officially verified on ouMusic'
  }
};

let currentLang = 'ru';

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (DICTIONARY[lang]) {
    currentLang = lang;
    applyTranslations();
  }
}

export function t(key, params = {}) {
  const dict = DICTIONARY[currentLang] || DICTIONARY.ru;
  let text = dict[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return text;
}

export function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });
}

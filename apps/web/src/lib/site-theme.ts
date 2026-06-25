export type SiteTheme = 'summer-day' | 'summer-night';

export const themeStorageKey = 'starry-summer-theme';
export const themeCookieName = themeStorageKey;
export const themeCookieMaxAgeSeconds = 60 * 60 * 24 * 365;

/**
 * Resolves the automatic public theme from the visitor's local clock.
 */
export function getThemeForTime(date = new Date()): SiteTheme {
  const hour = date.getHours();

  return hour >= 6 && hour < 18 ? 'summer-day' : 'summer-night';
}

/**
 * Narrows arbitrary persisted values to the supported public theme names.
 */
export function isSiteTheme(value: string | null | undefined): value is SiteTheme {
  return value === 'summer-day' || value === 'summer-night';
}

/**
 * Returns the delay before the next automatic day/night theme boundary.
 */
export function getMillisecondsUntilNextThemeBoundary(date = new Date()) {
  const nextBoundary = new Date(date);
  const hour = date.getHours();

  nextBoundary.setHours(hour < 6 ? 6 : hour < 18 ? 18 : 30, 0, 0, 0);

  return nextBoundary.getTime() - date.getTime();
}

/**
 * Reads the browser theme cookie for client-side hydration and route changes.
 */
export function getThemeCookie(): SiteTheme | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const savedTheme = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${themeCookieName}=`))
    ?.split('=')[1];

  return isSiteTheme(savedTheme) ? savedTheme : null;
}

/**
 * Persists the explicit theme choice so the next early theme script starts correctly.
 */
export function setThemeCookie(nextTheme: SiteTheme) {
  document.cookie = `${themeCookieName}=${nextTheme}; Path=/; Max-Age=${themeCookieMaxAgeSeconds}; SameSite=Lax`;
}

/**
 * Builds the early inline script that applies the theme before first paint.
 */
export function getThemeInitScript() {
  return `
(function () {
  var themeKey = '${themeStorageKey}';
  var validThemes = { 'summer-day': true, 'summer-night': true };

  function isTheme(value) {
    return !!validThemes[value];
  }

  function getThemeForTime() {
    var hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? 'summer-day' : 'summer-night';
  }

  function getCookieTheme() {
    var cookies = document.cookie ? document.cookie.split('; ') : [];
    for (var index = 0; index < cookies.length; index += 1) {
      var pair = cookies[index].split('=');
      if (pair[0] === themeKey && isTheme(pair[1])) {
        return pair[1];
      }
    }

    return null;
  }

  try {
    var sessionTheme = window.sessionStorage.getItem(themeKey);
    document.documentElement.dataset.theme = isTheme(sessionTheme) ? sessionTheme : getCookieTheme() || getThemeForTime();
  } catch (error) {
    document.documentElement.dataset.theme = getCookieTheme() || getThemeForTime();
  }
}());`.trim();
}

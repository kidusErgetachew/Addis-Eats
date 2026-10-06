export function readStorage(key, fallback, session = false) {
  try {
    const value = (session ? sessionStorage : localStorage).getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value, session = false) {
  try {
    (session ? sessionStorage : localStorage).setItem(
      key,
      JSON.stringify(value),
    );
    return true;
  } catch {
    return false;
  }
}

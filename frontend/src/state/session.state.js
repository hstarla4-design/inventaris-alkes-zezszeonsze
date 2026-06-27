export function loadSession() {
  return JSON.parse(localStorage.getItem("petugas-session") || "null");
}

export function saveSession(user) {
  localStorage.setItem("petugas-session", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("petugas-session");
}

export const PERSISTED_ROLE_KEY = "sanctii_role";

export function getPersistedRole() {
  try {
    return localStorage.getItem(PERSISTED_ROLE_KEY);
  } catch {
    return null;
  }
}

export function setPersistedRole(role) {
  try {
    if (role) localStorage.setItem(PERSISTED_ROLE_KEY, role);
    else localStorage.removeItem(PERSISTED_ROLE_KEY);
  } catch {
    // ignore storage errors
  }
}


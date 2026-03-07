export const ROLE = {
  PATIENT: "patient",
  DOCTOR:  "doctor",
  ADMIN:   "admin",
};

// Auth0 stores custom roles as a namespaced claim set via an Auth0 Action.
// e.g. event.user.app_metadata.roles → set as https://sanctii.com/roles
const ROLES_CLAIM = "https://sanctii.com/roles";

export function getUserRoles(user) {
  if (!user) return [];
  return user[ROLES_CLAIM] || [];
}

export function hasRole(user, role) {
  return getUserRoles(user).includes(role);
}

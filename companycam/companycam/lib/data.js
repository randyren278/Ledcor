export const db = { projects: {} };
export function getProject(id) {
  if (!db.projects[id]) db.projects[id] = { id, name: `Project ${id}`, notes: [] };
  return db.projects[id];
}
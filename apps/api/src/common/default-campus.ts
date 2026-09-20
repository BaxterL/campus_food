/** Single-campus deployment: campus is internal until multi-campus is needed. */
export const DEFAULT_CAMPUS_ID = 'seed-campus-main';

export function resolveCampusId(campusId?: string): string {
  return campusId ?? DEFAULT_CAMPUS_ID;
}

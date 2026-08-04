import { useUser } from "../features/authentication/useUser";
import { useActiveChild } from "../contexts/ActiveChildContext";

/**
 * The single source of the child id for every child-scoped read/write.
 *
 * Resolves role duality (RESEARCH.md Pattern 1):
 *   - legacy/migrated student role  -> childId = the student's own user.id
 *   - parent role                   -> childId = the validated active-child
 *                                      id from ActiveChildContext (localStorage-backed)
 *   - unknown/unresolved role       -> childId = null
 *
 * Performs NO authorization (D-04) — RLS is the sole authority for whether
 * a read/write is allowed. This hook only supplies which id to query against.
 *
 * @returns {{ childId: string|null, ready: boolean }}
 */
export function useActiveChildId() {
  const { user, isStudent, isParent } = useUser();
  const { activeChildId } = useActiveChild();

  if (isStudent) {
    return { childId: user?.id ?? null, ready: !!user?.id };
  }
  if (isParent) {
    return { childId: activeChildId, ready: !!activeChildId };
  }
  return { childId: null, ready: false };
}

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useParentGate } from "../../contexts/ParentGateContext";
import { ParentGateMath } from "../settings/ParentGateMath";

/**
 * Route wrapper that mount-re-checks the shared parental gate (COPPA-01/02).
 * Mirrors src/ui/ProtectedRoute.jsx structurally, swapping the auth check for
 * useParentGate().passed. Because the wrapper remounts per route entry, a
 * direct URL or back-button re-entry naturally re-evaluates `passed` — no
 * cached bypass (Pitfall 11).
 */
function ParentGateProtectedRoute({ children }) {
  const { passed, pass } = useParentGate();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith("he");

  if (!passed) {
    return (
      <ParentGateMath
        onConsent={pass}
        onCancel={() => navigate(-1)}
        isRTL={isRTL}
      />
    );
  }

  return children;
}

export default ParentGateProtectedRoute;

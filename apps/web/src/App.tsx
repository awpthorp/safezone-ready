import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { prettyPathFromSearch } from "@/lib/platform";
import { CheckerPage } from "@/pages/CheckerPage";
import { LegalPage } from "@/pages/LegalPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

function HomeRedirect() {
  const { search } = useLocation();
  const pretty = prettyPathFromSearch(search);
  if (pretty) {
    return <Navigate to={pretty} replace />;
  }
  return <CheckerPage pageId="home" />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/meta" element={<CheckerPage pageId="meta" />} />
      <Route path="/youtube-shorts" element={<CheckerPage pageId="youtube-shorts" />} />
      <Route path="/tiktok" element={<CheckerPage pageId="tiktok" />} />
      <Route path="/privacy" element={<LegalPage kind="privacy" />} />
      <Route path="/terms" element={<LegalPage kind="terms" />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

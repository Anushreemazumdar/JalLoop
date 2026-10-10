import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.jsx";
import OverviewPage from "./pages/OverviewPage.jsx";
import ReportIncidentPage from "./pages/ReportIncidentPage.jsx";
import MapPage from "./pages/MapPage.jsx";
import IncidentDetailPage from "./pages/IncidentDetailPage.jsx";
import ShortagesPage from "./pages/ShortagesPage.jsx";
import RecoveryPlannerPage from "./pages/RecoveryPlannerPage.jsx";
import RecoveryReviewPage from "./pages/RecoveryReviewPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/report" element={<ReportIncidentPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/incidents/:id" element={<IncidentDetailPage />} />
        <Route path="/shortages" element={<ShortagesPage />} />
        <Route path="/recovery" element={<RecoveryPlannerPage />} />
        <Route path="/recovery/review" element={<RecoveryReviewPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

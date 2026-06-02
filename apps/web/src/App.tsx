import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/app/AppShell";
import { RequireAuth } from "@/app/RequireAuth";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { useAuthStore } from "@/features/auth/store";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { EditorPage } from "@/features/editor/EditorPage";
import { HomePage } from "@/features/home/HomePage";
import { NotFoundPage } from "@/features/not-found/NotFoundPage";
import { OnboardingPage } from "@/features/onboarding/OnboardingPage";
import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { ProjectOverviewPage } from "@/features/projects/ProjectOverviewPage";
import { RoomDnaPage } from "@/features/room-dna/RoomDnaPage";
import { UploadRoomPage } from "@/features/upload/UploadRoomPage";
import { ShoppingListPage } from "@/features/shopping-list/ShoppingListPage";
import { SurveyPage } from "@/features/survey/SurveyPage";
import "@/themes/store";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <HomePage />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/room-dna" element={<RoomDnaPage />} />
              <Route path="/upload" element={<UploadRoomPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectOverviewPage />} />
              <Route path="/projects/:id/editor" element={<EditorPage />} />
              <Route path="/projects/:id/shopping-list" element={<ShoppingListPage />} />
              <Route path="/survey" element={<SurveyPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

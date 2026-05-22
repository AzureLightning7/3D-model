import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/app/AppShell";
import { RequireAuth } from "@/app/RequireAuth";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { EditorPage } from "@/features/editor/EditorPage";
import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { ShoppingListPage } from "@/features/shopping-list/ShoppingListPage";
import { SurveyPage } from "@/features/survey/SurveyPage";
import "@/themes/store";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id/editor" element={<EditorPage />} />
              <Route path="/projects/:id/shopping-list" element={<ShoppingListPage />} />
              <Route path="/survey" element={<SurveyPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

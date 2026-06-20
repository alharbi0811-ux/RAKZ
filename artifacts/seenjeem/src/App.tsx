import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ViewportProvider } from "@/context/ViewportContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import StartGame from "@/pages/StartGame";
import ScorePage from "@/pages/ScorePage";
import QuestionPage from "@/pages/QuestionPage";
import LoginPage from "@/pages/LoginPage";
import VerifyOtpPage from "@/pages/VerifyOtpPage";
import HistoryPage from "@/pages/HistoryPage";
import WinPage from "@/pages/WinPage";
import StudyModeSetup from "@/pages/StudyModeSetup";
import StudyModeGame from "@/pages/StudyModeGame";

import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminCategoryForm from "@/pages/admin/AdminCategoryForm";
import AdminCategoryQuestions from "@/pages/admin/AdminCategoryQuestions";
import AdminQuestionForm from "@/pages/admin/AdminQuestionForm";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminAllQuestions from "@/pages/admin/AdminAllQuestions";
import AdminQRTemplates from "@/pages/admin/AdminQRTemplates";
import AdminExternalPages from "@/pages/admin/AdminExternalPages";
import AdminExternalPageDesigner from "@/pages/admin/AdminExternalPageDesigner";
import AdminCategoryLayouts from "@/pages/admin/AdminCategoryLayouts";
import AdminSiteSettings from "@/pages/admin/AdminSiteSettings";
import AdminStudyMode from "@/pages/admin/AdminStudyMode";
import AdminFeedback from "@/pages/admin/AdminFeedback";
import AdminBulkQuestions from "@/pages/admin/AdminBulkQuestions";
import ExternalPage from "@/pages/ExternalPage";


const queryClient = new QueryClient();

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(270 22% 9%)" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-purple-500 animate-spin" />
        <p className="text-white/50 text-sm">جاري التحميل...</p>
      </div>
    </div>
  );
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <AuthLoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (!user.isAdmin) return <Redirect to="/" />;
  return <AdminLayout>{children}</AdminLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginPage} />
      <Route path="/verify-otp" component={VerifyOtpPage} />
      <Route path="/start-game" component={StartGame} />
      <Route path="/score-page" component={ScorePage} />
      <Route path="/question" component={QuestionPage} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/win-page" component={WinPage} />
      <Route path="/study-setup" component={StudyModeSetup} />
      <Route path="/study-game" component={StudyModeGame} />

      <Route path="/admin">
        <AdminGuard><AdminDashboard /></AdminGuard>
      </Route>
      <Route path="/admin/categories">
        <AdminGuard><AdminCategories /></AdminGuard>
      </Route>
      <Route path="/admin/questions">
        <AdminGuard><AdminAllQuestions /></AdminGuard>
      </Route>
      <Route path="/admin/categories/new">
        <AdminGuard><AdminCategoryForm /></AdminGuard>
      </Route>
      <Route path="/admin/categories/:id/edit">
        <AdminGuard><AdminCategoryForm /></AdminGuard>
      </Route>
      <Route path="/admin/categories/:id/questions">
        <AdminGuard><AdminCategoryQuestions /></AdminGuard>
      </Route>
      <Route path="/admin/questions/new">
        <AdminGuard><AdminQuestionForm /></AdminGuard>
      </Route>
      <Route path="/admin/questions/-1">
        <Redirect to="/admin/questions/new" />
      </Route>
      <Route path="/admin/questions/:id/edit">
        <AdminGuard><AdminQuestionForm /></AdminGuard>
      </Route>
      <Route path="/admin/users">
        <AdminGuard><AdminUsers /></AdminGuard>
      </Route>
      <Route path="/admin/qr-templates">
        <AdminGuard><AdminQRTemplates /></AdminGuard>
      </Route>
      <Route path="/admin/external-pages">
        <AdminGuard><AdminExternalPages /></AdminGuard>
      </Route>
      <Route path="/admin/external-pages/:id/design">
        <AdminGuard><AdminExternalPageDesigner /></AdminGuard>
      </Route>
      <Route path="/admin/category-layouts">
        <AdminGuard><AdminCategoryLayouts /></AdminGuard>
      </Route>
      <Route path="/admin/site-settings">
        <AdminGuard><AdminSiteSettings /></AdminGuard>
      </Route>
      <Route path="/admin/study-mode">
        <AdminGuard><AdminStudyMode /></AdminGuard>
      </Route>
      <Route path="/admin/feedback">
        <AdminGuard><AdminFeedback /></AdminGuard>
      </Route>
      <Route path="/admin/bulk-questions">
        <AdminGuard><AdminBulkQuestions /></AdminGuard>
      </Route>

      <Route path="/p/:slug" component={ExternalPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function AppShell() {
  const { theme } = useTheme();
  return (
    <div
      id="app-root"
      dir="rtl"
      className={`${theme === "light" ? "light" : ""} w-full min-h-screen transition-colors duration-300`}
    >
      <Router />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ViewportProvider>
            <ThemeProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <AppShell />
              </WouterRouter>
              <Toaster />
            </ThemeProvider>
          </ViewportProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

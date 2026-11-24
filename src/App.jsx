import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import News from "./pages/News";
import LiveScores from "./pages/LiveScores";
import Fixtures from "./pages/Fixtures";
import MatchCenter from "./pages/MatchCenter";
import Ligues from "./pages/Ligues";
import LeagueDetail from "./pages/LeagueDetail";
import Teams from "./pages/Teams";
import TeamDetail from "./pages/TeamDetail";
import Players from "./pages/Players";
import PlayerDetail from "./pages/PlayerDetail";
import Search from "./pages/Search";
import AIAssistant from "./pages/AIAssistant";
import Contact from "./pages/Contact";
import Account from "./pages/Account";
import MyFootball from "./pages/MyFootball";
import Notifications from "./pages/Notifications";
import Dashboard from "./pages/Dashboard";
import AppLayout from "./ui/AppLayout";

import GlobalStyles from "./styles/GlobalStyles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ReadPost from "./ui/ReadPost";
import Posts from "./features/posts/Posts";
import DashboardHome from "./features/dashboard/DashboardHome";

const ArticleEditor = lazy(() => import("./features/posts/ArticleEditor"));
import Categories from "./features/categories/Categories";
import Comments from "./features/comments/Comments";
import Profil from "./features/profile/Profil";
import Settings from "./features/settings/Settings";
import Users from "./features/users/Users";
import Messages from "./features/messages/Messages";
import Broadcast from "./features/broadcast/Broadcast";
import NotFound from "./pages/NotFound";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./ui/ProtectedRoute";
import UserRoute from "./ui/UserRoute";
import { useSessionRestore } from "./hooks/useAuth";
import { ThemeProvider } from "./theme/ThemeContext";
import { useSiteIntegrations } from "./utils/seo";
import AnalyticsTracker from "./components/AnalyticsTracker";
import BackToTop from "./components/BackToTop";

const AuthBootstrap = () => {
  useSessionRestore();
  useSiteIntegrations();
  return null;
};

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
};

const App = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 0 } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalStyles />
      <ThemeProvider>
      <AuthBootstrap />
      <BrowserRouter>
        <ScrollToTop />
        <AnalyticsTracker />
        <BackToTop />
        <Routes>
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<ReadPost />} />

            <Route path="/scores" element={<LiveScores />} />
            <Route path="/matchs" element={<Fixtures />} />
            <Route path="/match/:id" element={<MatchCenter />} />
            <Route path="/ligues" element={<Ligues />} />
            <Route path="/ligues/:id" element={<LeagueDetail />} />
            <Route path="/equipes" element={<Teams />} />
            <Route path="/equipes/:id" element={<TeamDetail />} />
            <Route path="/joueurs" element={<Players />} />
            <Route path="/joueurs/:id" element={<PlayerDetail />} />
            <Route path="/recherche" element={<Search />} />
            <Route path="/assistant" element={<AIAssistant />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/compte" element={<Account />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route element={<UserRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/mon-espace" element={<MyFootball />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<DashboardHome />} />
              <Route path="posts" element={<Posts />} />
              <Route
                path="posts/nouveau"
                element={
                  <Suspense fallback={<div className="py-20 text-center text-emerald-700">Chargement de l'éditeur…</div>}>
                    <ArticleEditor />
                  </Suspense>
                }
              />
              <Route
                path="posts/:id/modifier"
                element={
                  <Suspense fallback={<div className="py-20 text-center text-emerald-700">Chargement de l'éditeur…</div>}>
                    <ArticleEditor />
                  </Suspense>
                }
              />
              <Route path="categories" element={<Categories />} />
              <Route path="comments" element={<Comments />} />
              <Route path="messages" element={<Messages />} />
              <Route path="diffusion" element={<Broadcast />} />
              <Route path="users" element={<Users />} />
              <Route path="profil" element={<Profil />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      </ThemeProvider>
      <Toaster
        position="top-center"
        gutter={8}
        toastOptions={{
          className: "fa-toast",
          success: { duration: 4000 },
          error: { duration: 6000 },
        }}
      />
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
};

export default App;

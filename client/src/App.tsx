import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ScrollToTop from "./components/ScrollToTop";

import UserLayout from "./components/User/UserLayout/UserLayout";
import UserDashboard from "./components/User/UserDashboard/UserDashboard";
import ArticleDetail from "./components/User/ArticalDetails/ArticalDetails";
import LiveDetail from "./components/User/LiveDetails/LiveDetails";
import LiveEventsPage from "./components/User/LiveEventsPage/LiveEventsPage";
import TopicPage from "./components/User/TopicPage/TopicPage";
import TopicDetail from "./components/User/TopicDetail/TopicDetail";
import CategoryTemplate from "./components/User/CategoryTemplate/CategoryTemplate";
import AdvertiseWithUs from "./components/User/AdvertiseWithUs/AdvertiseWithUs";
import AboutUs from "./components/User/AboutUs/AboutUs";
import ContactUs from "./components/User/ContactUs/ContactUs";
import UserProfile from "./components/User/UserProfile/UserProfile";
import TagPage from "./components/User/TagPage/TagPage";

import Login from "./components/Admin/auth/Login";
import AdminLayout from "./components/Admin/AdminLayout/AdminLayout";
import AdminDashboard from "./components/Admin/AdminDashboard/AdminDashboard";
import CommentsPage from "./components/Admin/CommentsPage/CommentsPage";
import AllNews from "./components/Admin/AllNews/AllNews";
import ScheduledPosts from "./components/Admin/ScheduledPosts/ScheduledPosts";
import BreakingNews from "./components/Admin/BreakingNews/BreakingNews";
import TrendingNews from "./components/Admin/Trendingnews/Trendingnews";
import Categories from "./components/Admin/Categories/Categories";
import Tags from "./components/Admin/Tags/Tags";
import MediaLibrary from "./components/Admin/MediaLibrary/MediaLibrary";
import AccountSettings from "./components/Admin/Accountsettings/Accountsettings";
import CreateNewArticle from "./components/Admin/CreateNewArticle/CreateNewArticle";
import LiveStoriesPage from "./components/Admin/Livestories/Livestories";
import Notifications from "./components/Admin/Notifications/Notifications";
import TopicProfiles from "./components/Admin/TopicProfiles/TopicProfiles";
import FooterManagement from "./components/Admin/FooterManagement/FooterManagement";
import AdvertisementManager from "./components/Admin/AdvertisementManager/AdvertisementManager";
import AboutUsAdmin from "./components/Admin/AboutUsAdmin/AboutUsAdmin";
import ContactUsAdmin from "./components/Admin/ContactUsAdmin/ContactUsAdmin";
import UserInsights from "./components/Admin/UserInsights/UserInsights";
import Editors from "./components/Admin/Editors/Editors";
import EditorDashboard from "./components/Admin/EditorDashboard/EditorDashboard";

import ProtectedRoute from "./routes/protectedroutes";

import { AuthProvider } from "./context/AuthContext";

import NotFound404 from "./components/User/Errors/NotFound404";
import ServerError500 from "./components/User/Errors/ServerError500";
import AccessDenied403 from "./components/User/Errors/AccessDenied403";
import OfflineFallback from "./components/User/Errors/OfflineFallback";

import { Toaster } from "react-hot-toast";

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOnline) {
    return <OfflineFallback />;
  }

  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
      />

      <BrowserRouter>
        <ScrollToTop />

        <Routes>

          {/* ================================================================
              USER ROUTES
          ================================================================= */}

          <Route
            element={
              <AuthProvider>
                <UserLayout />
              </AuthProvider>
            }
          >
            <Route path="/" element={<UserDashboard />} />

            <Route
              path="/article/:articleId"
              element={<ArticleDetail />}
            />

            <Route
              path="/news/:articleId"
              element={<ArticleDetail />}
            />

            <Route
              path="/live/:eventId"
              element={<LiveDetail />}
            />

            <Route
              path="/live-events"
              element={<LiveEventsPage />}
            />

            <Route
              path="/Topic"
              element={<TopicPage />}
            />

            <Route
              path="/topic/:slug"
              element={<TopicDetail />}
            />

            <Route
              path="/profile"
              element={<UserProfile />}
            />

            <Route
              path="/advertise"
              element={<AdvertiseWithUs />}
            />

            <Route
              path="/about"
              element={<AboutUs />}
            />

            <Route
              path="/contact"
              element={<ContactUs />}
            />

            <Route
              path="/tag/:tagSlug"
              element={<TagPage />}
            />

            <Route
              path="/category/:slug"
              element={<CategoryTemplate />}
            />
          </Route>

          {/* ================================================================
              ADMIN LOGIN
          ================================================================= */}

          <Route
            path="/admin/login-xyzsft"
            element={<Login />}
          />

          {/* ================================================================
              ADMIN PANEL
              
              Admin can access every Admin page.
              ProtectedRoute handles authentication and role separation.
          ================================================================= */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={<AdminDashboard />}
            />

            <Route
              path="dashboard"
              element={<AdminDashboard />}
            />

            <Route
              path="editors"
              element={<Editors />}
            />

            <Route
              path="news"
              element={<AllNews />}
            />

            <Route
              path="news/create"
              element={<CreateNewArticle />}
            />

            <Route
              path="create"
              element={<CreateNewArticle />}
            />

            <Route
              path="breaking"
              element={<BreakingNews />}
            />

            <Route
              path="trending"
              element={<TrendingNews />}
            />

            <Route
              path="schedule"
              element={<ScheduledPosts />}
            />

            <Route
              path="comments"
              element={<CommentsPage />}
            />

            <Route
              path="categories"
              element={<Categories />}
            />

            <Route
              path="tags"
              element={<Tags />}
            />

            <Route
              path="medialibrary"
              element={<MediaLibrary />}
            />

            <Route
              path="setting"
              element={<AccountSettings />}
            />

            <Route
              path="live"
              element={<LiveStoriesPage />}
            />

            <Route
              path="notification"
              element={<Notifications />}
            />

            <Route
              path="profile"
              element={<TopicProfiles />}
            />

            <Route
              path="footer-management"
              element={<FooterManagement />}
            />

            <Route
              path="advertisement-manager"
              element={<AdvertisementManager />}
            />

            <Route
              path="about-manager"
              element={<AboutUsAdmin />}
            />

            <Route
              path="contact-manager"
              element={<ContactUsAdmin />}
            />

            <Route
              path="user-insights"
              element={<UserInsights />}
            />
          </Route>

          {/* ================================================================
              EDITOR PANEL
              
              IMPORTANT:
              These are the EXISTING Admin components.
              We are NOT creating duplicate Editor pages.
              
              ProtectedRoute decides whether the Editor has permission.
          ================================================================= */}

          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Editor Dashboard — always accessible */}
            <Route
              index
              element={<EditorDashboard />}
            />

            <Route
              path="editor-dashboard"
              element={<EditorDashboard />}
            />

            <Route
  path="settings"
  element={<AccountSettings />}
/>

            {/* News */}
            <Route
              path="news"
              element={<AllNews />}
            />

            <Route
              path="news/create"
              element={<CreateNewArticle />}
            />

            <Route
              path="create"
              element={<CreateNewArticle />}
            />

            {/* Breaking News */}
            <Route
              path="breaking"
              element={<BreakingNews />}
            />

            {/* Live News */}
            <Route
              path="live"
              element={<LiveStoriesPage />}
            />

            {/* Comments */}
            <Route
              path="comments"
              element={<CommentsPage />}
            />

            {/* Trending */}
            <Route
              path="trending"
              element={<TrendingNews />}
            />

            {/* Scheduled */}
            <Route
              path="schedule"
              element={<ScheduledPosts />}
            />

            {/* Categories */}
            <Route
              path="categories"
              element={<Categories />}
            />

            {/* Tags */}
            <Route
              path="tags"
              element={<Tags />}
            />

            {/* Media Library */}
            <Route
              path="medialibrary"
              element={<MediaLibrary />}
            />

            {/* Notifications */}
            <Route
              path="notification"
              element={<Notifications />}
            />

            {/* Topic Profile */}
            <Route
              path="profile"
              element={<TopicProfiles />}
            />

            {/* Analytics / User Insights */}
            <Route
              path="user-insights"
              element={<UserInsights />}
            />

            {/* Footer */}
            <Route
              path="footer-management"
              element={<FooterManagement />}
            />

            {/* Advertisement */}
            <Route
              path="advertisement-manager"
              element={<AdvertisementManager />}
            />

            {/* Contact */}
            <Route
              path="contact-manager"
              element={<ContactUsAdmin />}
            />
          </Route>

          {/* ================================================================
              ERROR ROUTES
          ================================================================= */}

          <Route
            path="/500"
            element={<ServerError500 />}
          />

          <Route
            path="/403"
            element={<AccessDenied403 />}
          />

          {/* 404 — MUST REMAIN LAST */}
          <Route
            path="*"
            element={<NotFound404 />}
          />

        </Routes>
      </BrowserRouter>
    </>
  );
}
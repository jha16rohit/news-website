import { BrowserRouter, Routes, Route } from "react-router-dom";

/* ================= USER SIDE ================= */
import UserLayout from "./components/User/UserLayout/UserLayout";
import UserDashboard from "./components/User/UserDashboard/UserDashboard";
import ArticleDetail from "./components/User/ArticalDetails/ArticalDetails";
import LiveDetail from "./components/User/LiveDetails/LiveDetails";
import LiveEventsPage from "./components/User/LiveEventsPage/LiveEventsPage";
import TopicPage from "./components/User/TopicPage/TopicPage";
import TopicDetail from "./components/User/TopicDetail/TopicDetail";
import CategoryTemplate from "./components/User/CategoryTemplate/CategoryTemplate";

/* ================= ADMIN SIDE ================= */
import Login from "./components/Admin/auth/Login";
import AdminLayout from "./components/Admin/AdminLayout/AdminLayout";
import AdminDashboard from "./components/Admin/AdminDashboard/AdminDashboard";
import CommentsPage from "./components/Admin/CommentsPage/CommentsPage";
import AllNews from "./components/Admin/AllNews/AllNews";
import ScheduledPosts from "./components/Admin/ScheduledPosts/ScheduledPosts";
import BreakingNews from "./components/Admin/BreakingNews/BreakingNews";
import TrendingNews from "./components/Admin/Trendingnews/Trendingnews";
import FeaturedContent from "./components/Admin/Featuredcontent/Featuredcontent";
import Categories from "./components/Admin/Categories/Categories";
import Tags from "./components/Admin/Tags/Tags";
import MediaLibrary from "./components/Admin/MediaLibrary/MediaLibrary";
import AccountSettings from "./components/Admin/Accountsettings/Accountsettings";
import Analytics from "./components/Admin/Analytics/Analytics";
import CreateNewArticle from "./components/Admin/CreateNewArticle/CreateNewArticle";
import LiveStoriesPage from "./components/Admin/Livestories/Livestories";
import Notifications from "./components/Admin/Notifications/Notifications";
import TopicProfiles from "./components/Admin/TopicProfiles/TopicProfiles";
import { NewsProvider } from "./components/Admin/NewsProvider/NewsProvider";
import UserProfile from "./components/User/UserProfile/UserProfile";
import FooterManagement from "./components/Admin/FooterManagement/FooterManagement";


import ProtectedRoute from "./routes/protectedroutes";

export default function App() {
  return (
    <NewsProvider>
      <BrowserRouter>
        <Routes>

          {/* USER ROUTES */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<UserDashboard />} />
            <Route path="/article/:articleId" element={<ArticleDetail />} />
            <Route path="/live/:eventId" element={<LiveDetail />} />
            <Route path="/live-events" element={<LiveEventsPage />} />
            <Route path="/Topic" element={<TopicPage />} />
            <Route path="/topic/:id" element={<TopicDetail />} />
            <Route path="/article/:articleId" element={<ArticleDetail />} />
            <Route path="/profile" element={<UserProfile />} />
          </Route>

          {/*
            Dynamic category route — outside UserLayout so it renders
            its own Navbar + Footer (matching the sports page template).
            CategoryTemplate handles any slug; the component itself shows
            a "not found" state if the slug doesn't match a known category.
          */}
          <Route path="/category/:slug" element={<CategoryTemplate />} />

          {/* ADMIN LOGIN */}
          <Route path="/admin/login-xyzsft" element={<Login />} />

          {/* ADMIN PANEL */}
         <Route
  path="/admin"
  element={
    <ProtectedRoute>
      <AdminLayout />
    </ProtectedRoute>
  }
>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="news" element={<AllNews />} />
            <Route path="news/create" element={<CreateNewArticle />} />
            <Route path="breaking" element={<BreakingNews />} />
            <Route path="trending" element={<TrendingNews />} />
            <Route path="feature" element={<FeaturedContent />} />
            <Route path="schedule" element={<ScheduledPosts />} />
            <Route path="comments" element={<CommentsPage />} />
            <Route path="categories" element={<Categories />} />
            <Route path="tags" element={<Tags />} />
            <Route path="medialibrary" element={<MediaLibrary />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="setting" element={<AccountSettings />} />
            <Route path="live" element={<LiveStoriesPage />} />
            <Route path="notification" element={<Notifications />} />
            <Route path="profile" element={<TopicProfiles />} />
            <Route path="footer-management" element={<FooterManagement />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<h1>Page Not Found</h1>} />

        </Routes>
      </BrowserRouter>
    </NewsProvider>
  );
}
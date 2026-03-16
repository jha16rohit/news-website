import { BrowserRouter, Routes, Route } from "react-router-dom";

/* ================= USER SIDE ================= */
import UserLayout from "./components/User/UserLayout/UserLayout";
import UserDashboard from "./components/User/UserDashboard/UserDashboard";
import ArticleDetail from "./components/User/ArticalDetails/ArticalDetails";
import LiveDetail from "./components/User/LiveDetails/LiveDetails";
import LiveEventsPage from "./components/User/LiveEventsPage/LiveEventsPage";
const CategoryPage = () => <div style={{ padding: "100px", textAlign: "center" }}>Category Page Placeholder</div>;

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* USER ROUTES */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<UserDashboard />} />
          <Route path="/category/:categoryName" element={<CategoryPage />} />
          <Route path="/article/:articleId" element={<ArticleDetail />} />
          <Route path="/live/:eventId" element={<LiveDetail />} />
          <Route path="/live-events" element={<LiveEventsPage />} />
        </Route>

        {/* ADMIN LOGIN */}
        <Route path="/admin/login-xyzsft" element={<Login />} />

        {/* ADMIN PANEL — NewsProvider lives inside AdminLayout */}
        <Route path="/admin" element={<AdminLayout />}>
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
        </Route>

        {/* 404 */}
        <Route path="*" element={<h1>Page Not Found</h1>} />

      </Routes>
    </BrowserRouter>
  );
}
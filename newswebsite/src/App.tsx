import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/auth/Login";
import AdminLayout from "./components/AdminLayout/AdminLayout";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import CommentsPage from "./components/CommentsPage/CommentsPage";
import AllNews from "./components/AllNews/AllNews";
import ScheduledPosts from "./components/ScheduledPosts/ScheduledPosts";
import BreakingNews from "./components/BreakingNews/BreakingNews";
import TrendingNews from "./components/Trendingnews/Trendingnews";
import FeaturedContent from "./components/Featuredcontent/Featuredcontent";
import Categories from "./components/Categories/Categories";
import Tags from "./components/Tags/Tags";
import MediaLibrary from "./components/MediaLibrary/MediaLibrary";
import AccountSettings from "./components/Accountsettings/Accountsettings";
import Analytics from "./components/Analytics/Analytics";
import CreateNewArticle from "./components/CreateNewArticle/CreateNewArticle";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        {/* Login */}
        <Route path="/admin/login" element={<Login />} />

        {/* 🔥 ADMIN LAYOUT WRAPPER */}
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

        </Route>

        {/* Fallback */}
        <Route path="*" element={<h1>Page Not Found</h1>} />

      </Routes>
    </BrowserRouter>
  );
}

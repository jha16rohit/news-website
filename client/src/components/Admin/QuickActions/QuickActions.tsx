import "./QuickActions.css";
import {
  FileText,
  Zap,
  Image,
  Video,
  Folder,
  Bell,
  BarChart,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="quick-actions">
      <h3>Quick Actions</h3>

      <div className="actions-grid">
        <Action
          icon={<FileText />}
          label="New Article"
          variant="blue"
          onClick={() => navigate("/admin/news/create")}
        />

        <Action
          icon={<Zap />}
          label="Breaking News"
          variant="red"
          onClick={() => navigate("/admin/breaking")}
        />

        <Action
          icon={<Image />}
          label="Media"
          variant="purple"
          onClick={() => navigate("/admin/medialibrary")}
        />

        <Action
          icon={<Video />}
          label="Video Story"
          variant="pink"
          onClick={() => navigate("/admin/news/create?type=video")}
        />

        <Action
          icon={<Folder />}
          label="Categories"
          variant="orange"
          onClick={() => navigate("/admin/categories")}
        />

        <Action
          icon={<Bell />}
          label="Notifications"
          variant="green"
          onClick={() => navigate("/admin/notification")}
        />

        <Action
          icon={<BarChart />}
          label="Analytics"
          variant="indigo"
          onClick={() => navigate("/admin/analytics")}
        />

        <Action
          icon={<Settings />}
          label="Settings"
          variant="gray"
          onClick={() => navigate("/admin/setting")}
        />
      </div>
    </div>
  );
};

interface ActionProps {
  icon: React.ReactNode;
  label: string;
  variant:
    | "blue"
    | "red"
    | "purple"
    | "pink"
    | "orange"
    | "green"
    | "indigo"
    | "gray";
  onClick: () => void;
}

const Action = ({ icon, label, variant, onClick }: ActionProps) => {
  return (
    <div
      className={`action-card ${variant}`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <div className="action-icon">{icon}</div>
      <span>{label}</span>
    </div>
  );
};

export default QuickActions;

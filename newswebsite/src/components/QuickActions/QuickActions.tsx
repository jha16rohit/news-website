import "./QuickActions.css";
import {
  FileText,
  Zap,
  Image,
  Video,
  Folder,
  Users,
  BarChart,
  Settings,
} from "lucide-react";

const QuickActions = () => {
  return (
    <div className="quick-actions">
      <h3>Quick Actions</h3>

      <div className="actions-grid">
        <Action icon={<FileText />} label="New Article" variant="blue" />
        <Action icon={<Zap />} label="Breaking News" variant="red" />
        <Action icon={<Image />} label="Upload Media" variant="purple" />
        <Action icon={<Video />} label="Video Story" variant="pink" />
        <Action icon={<Folder />} label="Categories" variant="orange" />
        <Action icon={<Users />} label="Authors" variant="green" />
        <Action icon={<BarChart />} label="Analytics" variant="indigo" />
        <Action icon={<Settings />} label="Settings" variant="gray" />
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
}

const Action = ({ icon, label, variant }: ActionProps) => {
  return (
    <div className={`action-card ${variant}`}>
      <div className="action-icon">{icon}</div>
      <span>{label}</span>
    </div>
  );
};

export default QuickActions;

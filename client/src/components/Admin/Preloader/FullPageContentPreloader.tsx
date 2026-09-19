import ContentPreloader from "./ContentPreloader";

interface FullPageContentPreloaderProps {
  message?: string;
}

export function FullPageContentPreloader({ message = "Loading..." }: FullPageContentPreloaderProps) {
  return (
    <div className="admin-full-page-loader">
      <ContentPreloader message={message} size="lg" />
    </div>
  );
}
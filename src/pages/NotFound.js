import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="panel-eyebrow mb-4">404</p>
      <h1 className="panel-h2 font-display mb-4">Page Not Found</h1>
      <p className="panel-body max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="hero-btn hero-btn-primary inline-flex items-center gap-2"
      >
        <ArrowLeft size={16} />
        Back to Home
      </Link>
    </div>
  );
}


import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import SiteHeader from "@/components/SiteHeader";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="container mx-auto px-6 py-6">
        <SiteHeader />
      </header>
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
          <Link to="/" className="text-blue-500 hover:text-blue-700 underline">
            Shithead
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

import { useNavigate } from "react-router-dom";
import { useUser } from "../features/authentication/useUser";
import Spinner from "./Spinner";
import { useEffect } from "react";

function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  //1. Load authenticated user
  const { isPending, isAuthenticated } = useUser();

  //2. if user is not authenticated redirect to login page
  useEffect(() => {
    if (!isAuthenticated && !isPending) {
      navigate("/login");
    }
  }, [isAuthenticated, isPending, navigate]);

  //3. while loading show spinner
  if (isPending) return <Spinner />;

  //4. if user is authenticated show children (render the App)
  if (isAuthenticated) return children;
}

export default ProtectedRoute;

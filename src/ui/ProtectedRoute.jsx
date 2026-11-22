import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import Spinner from "./Spinner";

const ProtectedRoute = () => {
  const { user, isAuthenticated, hydrated } = useSelector(state => state.user);

  // Wait for the stored session to be restored before deciding
  if (!hydrated) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/compte" replace />;
  if (user?.role !== "admin" && user?.role !== "editor")
    return <Navigate to="/" replace />;

  return <Outlet />;
};

export default ProtectedRoute;

import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import Spinner from "./Spinner";

const UserRoute = () => {
  const { isAuthenticated, hydrated } = useSelector(state => state.user);
  if (!hydrated) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/compte" replace />;
  return <Outlet />;
};

export default UserRoute;

import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../services/analytics";

/** Logs every public route change as a page view. Renders nothing. */
const AnalyticsTracker = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
  return null;
};

export default AnalyticsTracker;

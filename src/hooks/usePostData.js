import { useQuery } from "@tanstack/react-query";
import { getPublishedPosts, getPosts } from "../services/apiPosts";

/** Published articles for the public website. */
export const usePostData = function () {
  const { data, isLoading, error } = useQuery({
    queryKey: ["Posts", "published"],
    queryFn: getPublishedPosts,
  });

  return { data, isLoading, error };
};

/** All articles (any status) — dashboard only. */
export const useAllPosts = function () {
  const { data, isLoading, error } = useQuery({
    queryKey: ["Posts", "all"],
    queryFn: getPosts,
  });

  return { data, isLoading, error };
};

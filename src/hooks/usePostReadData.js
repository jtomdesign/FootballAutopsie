import { useQuery } from "@tanstack/react-query";
import { getPublishedPostBySlug } from "../services/apiPosts";
import { toast } from "react-hot-toast";

export const usePostReadData = function (slug) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["Posts", "published", slug],
    queryFn: () => getPublishedPostBySlug(slug),
  });

  if (error) {
    toast(error.message);
  }

  return { data, isLoading };
};

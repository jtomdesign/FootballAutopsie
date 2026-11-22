import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePost as deletePostApi } from "../services/apiPosts";
import { toast } from "react-hot-toast";

export const useDeletePost = function () {
  const queryClient = useQueryClient();
  const { mutate: deletePost, isLoading: isDeleting } = useMutation({
    mutationKey: ["Posts"],
    mutationFn: deletePostApi,

    onSuccess: () => {
      toast.success("Post deleted succesfully");
      queryClient.invalidateQueries({ queryKey: ["Posts"] });
    },
    onError: err => toast.error(err.message),
  });

  return { deletePost, isDeleting };
};

import { toast } from "react-hot-toast";
import { CreateEditPost } from "../services/apiPosts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdatePost = function () {
  const queryClient = useQueryClient();

  const { mutate: updatePost, isPending } = useMutation({
    mutationKey: ["Posts"],
    mutationFn: ({ newPostData, id }) => CreateEditPost(newPostData, id),
    onSuccess: () => {
      toast.success("New Post successfully updated");
      queryClient.invalidateQueries({ queryKey: ["Posts"] });
    },
    onError: err => toast.error(err.message),
  });

  return { updatePost, isPending };
};

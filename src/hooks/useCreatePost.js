import { toast } from "react-hot-toast";
import { CreateEditPost } from "../services/apiPosts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreatePost = function () {
  const queryClient = useQueryClient();

  const { mutate: createPost, isPending } = useMutation({
    mutationKey: ["Posts"],
    mutationFn: ({ createdData, id }) => CreateEditPost(createdData, id),
    onSuccess: () => {
      toast.success("New Post successfully created");
      queryClient.invalidateQueries({
        queryKey: ["Posts"],
      });
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  return { createPost, isPending };
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/apiPosts";
import { toast } from "react-hot-toast";

export const useCategories = () =>
  useQuery({
    queryKey: ["Categories"],
    queryFn: getCategories,
  });

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      toast.success("Catégorie créée");
      queryClient.invalidateQueries({ queryKey: ["Categories"] });
    },
    onError: err => toast.error(err.message),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      toast.success("Catégorie mise à jour");
      queryClient.invalidateQueries({ queryKey: ["Categories"] });
    },
    onError: err => toast.error(err.message),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast.success("Catégorie supprimée");
      queryClient.invalidateQueries({ queryKey: ["Categories"] });
    },
    onError: err => toast.error(err.message),
  });
};

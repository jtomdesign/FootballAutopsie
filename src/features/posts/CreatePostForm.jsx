import React from "react";
import { useForm } from "react-hook-form";
import FormRow from "../../ui/FormRow";
import { slugify } from "../../utils/helpers";
import { useCreatePost } from "../../hooks/useCreatePost";
import { useUpdatePost } from "../../hooks/useUpdatePost";
import Button from "../../ui/Button";

const CreatePostForm = ({ postToEdit = {}, onCloseModal }) => {
  const { createPost, isPending: isCreating } = useCreatePost();
  const { updatePost, isPending: isUpdating } = useUpdatePost();

  const { id: editId, ...editValues } = postToEdit;

  const isEditSession = Boolean(editId);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ defaultValues: isEditSession ? editValues : {} });

  const isWorking = isCreating || isUpdating;

  const onSubmit = function (data) {
    const image =
      typeof data.featuredImage === "string"
        ? data.featuredImage
        : data.featuredImage[0];

    const formData = {
      ...data,
      slug: slugify(data.slug),
      featuredImage: image,
    };

    if (isEditSession) {
      updatePost(
        { newPostData: formData, id: editId },
        {
          onSuccess: () => {
            reset();
            onCloseModal?.();
          },
        },
      );
    } else {
      createPost(
        { createdData: formData, id: undefined },
        {
          onSuccess: () => {
            reset();
            onCloseModal?.();
          },
        },
      );
    }
  };

  return (
    <form className="grid grid-cols-2 gap-3" onSubmit={handleSubmit(onSubmit)}>
      <FormRow label={"Title"} error={errors?.title?.message}>
        <input
          className="border focus:ring-emerald-400 focus:ring-1 focus:outline-none border-emerald-400/50 py-3 px-3 rounded-full text-sm text-emerald-800 my-2 "
          type="text"
          name="title"
          id="title"
          {...register("title", { required: "This field is required" })}
        />
      </FormRow>
      <FormRow label={"Slug"} error={errors?.slug?.message}>
        <input
          className="border focus:ring-emerald-400 focus:ring-1 focus:outline-none border-emerald-400/50 py-3 px-3 rounded-full text-sm text-emerald-800 my-2 "
          type="text"
          name="slug"
          id="slug"
          {...register("slug", { required: "This field is required" })}
          disabled={isWorking}
        />
      </FormRow>
      <FormRow label={"Content"} error={errors?.content?.message}>
        <textarea
          className="border  focus:ring-emerald-400 focus:ring-1 focus:outline-none border-emerald-400/50 py-3 px-3 rounded-full text-sm text-emerald-800 my-2 "
          type="text"
          name="content"
          id="content"
          {...register("content", { required: "This field is required" })}
        />
      </FormRow>
      <FormRow label={"Reading time"} error={errors?.readingTime?.message}>
        <input
          className="border focus:ring-emerald-400 focus:ring-1 focus:outline-none border-emerald-400/50 py-3 px-3 rounded-full text-sm text-emerald-800 my-2 "
          type="number"
          name="readingTime"
          id="readingTime"
          defaultValue={0}
          {...register("readingTime", { required: false })}
        />
      </FormRow>

      <FormRow label={"Excerpt"} error={errors?.excerpt?.message}>
        <input
          className="border focus:ring-emerald-400 focus:ring-1 focus:outline-none border-emerald-400/50 py-3 px-3 rounded-full text-sm text-emerald-800 my-2 "
          type="text"
          name="excerpt"
          id="excerpt"
          {...register("excerpt", { required: false })}
        />
      </FormRow>
      <FormRow label={"Status"} error={errors?.status?.message}>
        <select
          className="border focus:ring-emerald-400 focus:ring-1 focus:outline-none border-emerald-400/50 py-3 px-3 rounded-full text-sm text-emerald-800 my-2 "
          name="status"
          id="status"
          {...register("status", { required: false })}
        >
          <option value="unpublished">Unpublished</option>
          <option value="published">Published</option>
        </select>
      </FormRow>
      <FormRow label={"Featured Image"} error={errors?.featuredImage?.message}>
        <input
          className="file:font-[inherit] file:font-medium file:py-[0.8rem] file:px-[1.2rem] file:mr-[1.2rem] file:rounded-full file:border-0 file:text-white file:bg-emerald-600 file:cursor-pointer file:transition-colors file:duration-200 hover:file:ring-emerald-400/50 focus: border   focus:outline-none  text-emerald-800 border-none"
          type="file"
          id="featuredImage"
          accept="image/*"
          {...register("featuredImage", { required: false })}
        />
      </FormRow>
      <div></div>
      <div></div>
      <div></div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          name="isBreaking"
          id="isBreaking"
          {...register("isBreaking", { required: false })}
          className="cursor-pointer"
        />
        <span className="text-sm font-bold text-emerald-600">
          Mark this as breaking news?
        </span>
      </div>

      <div></div>
      <div></div>
      <div className="flex justify-end gap-3">
        <Button
          type="secondary"
          onClick={() => onCloseModal?.()}
          name="Cancel"
          role="reset"
        />
        <Button name={isEditSession ? "Update post" : "Add post"} />
      </div>
    </form>
  );
};

export default CreatePostForm;

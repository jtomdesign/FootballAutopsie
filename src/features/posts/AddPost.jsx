import React from "react";
import { Link } from "react-router-dom";
import Button from "../../ui/Button";
import {
  LuPlus,
} from "react-icons/lu";

const AddPost = () => {
  return (
    <Link to="/dashboard/posts/nouveau">
      <Button type="primary" name="Nouvel article" icon={<LuPlus />} />
    </Link>
  );
};

export default AddPost;

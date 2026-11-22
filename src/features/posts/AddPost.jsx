import React from "react";
import { Link } from "react-router-dom";
import Button from "../../ui/Button";
import { RiAddLargeLine } from "react-icons/ri";

const AddPost = () => {
  return (
    <Link to="/dashboard/posts/nouveau">
      <Button type="primary" name="Nouvel article" icon={<RiAddLargeLine />} />
    </Link>
  );
};

export default AddPost;

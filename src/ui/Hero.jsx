import React from "react";
import { usePostData } from "../hooks/usePostData";
import { HiArrowRight } from "react-icons/hi";
import Spinner from "./Spinner";
import PostCard from "./PostCard";
import { Container } from "./Container";

const Hero = () => {
  const { data: posts = [], isLoading } = usePostData();

  if (isLoading) return <Spinner />;

  if (!posts) return null;

  return (
    <Container>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3  mt-5">
        {posts.map(
          (post, id) =>
            post.status === "published" && (
              <PostCard post={post} id={id} key={post.id} />
            ),
        )}
      </div>
    </Container>
  );
};

export default Hero;

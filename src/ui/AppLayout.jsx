import React from "react";

import { styled } from "styled-components";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";
import { Container } from "./Container";

const StyledMain = styled.main`
  /* padding: 10px; */
  /* margin-top: 1.5rem; */
`;
const StyledLayout = styled.div`
  /* padding: 10px; */
`;
const AppLayout = () => {
  return (
    <StyledLayout>
      <Navbar />

      <StyledMain>
        <Outlet />
      </StyledMain>
      <Footer />
    </StyledLayout>
  );
};

export default AppLayout;

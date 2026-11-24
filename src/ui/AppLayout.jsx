import React from "react";

import { styled } from "styled-components";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
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

      <StyledMain className="pb-16 md:pb-0">
        <Outlet />
      </StyledMain>
      <Footer />
      <BottomNav />
    </StyledLayout>
  );
};

export default AppLayout;

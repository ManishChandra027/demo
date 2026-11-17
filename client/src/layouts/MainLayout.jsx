import { Outlet } from "react-router-dom";

import Header from "../components/common/Header";
import Footer from "../components/common/Footer";

const MainLayout = ({ headerProps = {}, footerProps = {} }) => {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Header {...headerProps} />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pt-6 md:px-8 md:pb-10 lg:px-10">
        <Outlet />
      </main>

      <Footer {...footerProps} />
    </div>
  );
};

export default MainLayout;

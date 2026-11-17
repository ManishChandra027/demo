import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "sonner";
import { login, logout, setInitialized } from "./features/auth/authSlice";
import { selectAuthInitialized } from "./features/auth/authSelector";
import { getCurrentUser } from "./services/userService";
import Loader from "./components/common/Loader";

const App = () => {
  const dispatch = useDispatch();
  const initialized = useSelector(selectAuthInitialized);

  useEffect(() => {
    let isMounted = true;

    const checkCurrentUser = async () => {
      try {
        const response = await getCurrentUser();

        if (!isMounted) return;

        const userData = response?.data?.user;

        if (userData) {
          dispatch(
            login({
              ...userData,
              defaultAddress: response?.data?.defaultAddress || null,
            }),
          );
        } else {
          dispatch(logout());
        }
      } catch {
        if (isMounted) {
          dispatch(logout());
        }
      } finally {
        if (isMounted) {
          dispatch(setInitialized(true));
        }
      }
    };

    checkCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  return (
    <>
      <Toaster
        position="top-center"
        richColors
        duration={3000}
        theme="light"
        offset={70}
      />

      {!initialized ? (
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <Loader fullPage label="Loading your account..." />
        </div>
      ) : (
        <Outlet />
      )}
    </>
  );
};

export default App;

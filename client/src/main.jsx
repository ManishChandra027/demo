
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
// import { StrictMode } from "react";
import store from "./app/store.js";
import appRouter from "./routes/AppRouter.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
    <Provider store={store}>
      <RouterProvider router={appRouter} />
    </Provider>
  //  </StrictMode>,
);

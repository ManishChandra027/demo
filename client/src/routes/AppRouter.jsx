import { createBrowserRouter } from "react-router-dom";

import App from "../App";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";

import Home from "../pages/Home";
import Products from "../pages/Products";
import ProductDetails from "../pages/ProductDetails";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Orders from "../pages/Orders";
import OrderDetails from "../pages/OrderDetails";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
// import MyProfile from "../pages/MyProfile";
import SettingsPage from "../pages/account/SettingsPage";
import NotFound from "../pages/NotFound";
import AccountLayout from "../layouts/AccountLayout";
import MyProfile from "../pages/account/MyProfile";
import ChangePassword from "../pages/account/ChangePassword";
import VerifyEmail from "../pages/account/VerifyEmail";
import ForgotPassword from "../pages/ForgotPassword";
import Addresses from "../pages/account/Addresses";
import Wishlist from "../pages/account/Wishlist";
import RequireAuth from "./RequireAuth";
import RequireAdmin from "./RequireAdmin";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProducts from "../pages/admin/AdminProducts";
import AdminProductForm from "../pages/admin/AdminProductForm";
import AdminCategories from "../pages/admin/AdminCategories";
import AdminInventory from "../pages/admin/AdminInventory";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminOrderDetails from "../pages/admin/AdminOrderDetails";
import AdminCustomers from "../pages/admin/AdminCustomers";
import AdminCustomerOrders from "../pages/admin/AdminCustomerOrders";
import StoreInfoPage from "../pages/StoreInfoPage";

const appRouter = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <Home />,
          },
          {
            path: "products",
            element: <Products />,
          },
          {
            path: "products/:slug",
            element: <ProductDetails />,
          },
          {
            path: "categories/:slug",
            element: <Products />,
          },
          { path: "privacy-policy", element: <StoreInfoPage type="privacy" /> },
          { path: "terms", element: <StoreInfoPage type="terms" /> },
          { path: "help", element: <StoreInfoPage type="help" /> },
          { path: "contact", element: <StoreInfoPage type="contact" /> },
          { path: "about", element: <StoreInfoPage type="about" /> },
          
          {
            element: <RequireAuth />,
            children: [
              {
                path: "cart",
                element: <Cart />,
              },
              {
                path: "checkout",
                element: <Checkout />,
              },
              {
                path: "orders",
                element: <Orders />,
              },
              {
                path: "orders/:orderId/confirmation",
                element: <OrderDetails confirmation />,
              },
              {
                path: "orders/:orderId",
                element: <OrderDetails />,
              },
            ],
          },
          {
            path: "account",
            element: <RequireAuth />,
            children: [
              {
                element: <AccountLayout />,
                children: [
                  {
                    index: true,
                    element: <MyProfile />,
                  },
                  {
                    path: "settings",
                    element: <SettingsPage />,
                  },
                  {
                    path: "change-password",
                    element: <ChangePassword />,
                  },
                  {
                    path: "verify-email",
                    element: <VerifyEmail />,
                  },
                  {
                    path: "addresses",
                    element: <Addresses />,
                  },
                  {
                    path: "orders",
                    element: <Orders />,
                  },
                  {
                    path: "wishlist",
                    element: <Wishlist />,
                  },
                  {
                    path: "help",
                    element: <StoreInfoPage type="help" />,
                  },
                ],
              },
            ],
          },
          {
            path: "*",
            element: <NotFound />,
          },
        ],
      },
      {
        element: <AuthLayout />,
        children: [
          {
            path: "login",
            element: <Login />,
          },
          {
            path: "signup",
            element: <Signup />,
          },
          {
            path: "forgot-password",
            element: <ForgotPassword />,
          },
        ],
      },
      {
        path: "admin",
        element: <RequireAuth />,
        children: [
          {
            element: <RequireAdmin />,
            children: [
              {
                element: <AdminLayout />,
                children: [
                  { index: true, element: <AdminDashboard /> },
                  { path: "products", element: <AdminProducts /> },
                  { path: "products/new", element: <AdminProductForm /> },
                  {
                    path: "products/:productId/edit",
                    element: <AdminProductForm />,
                  },
                  { path: "categories", element: <AdminCategories /> },
                  { path: "inventory", element: <AdminInventory /> },
                  { path: "orders", element: <AdminOrders /> },
                  { path: "orders/:orderId", element: <AdminOrderDetails /> },
                  { path: "customers", element: <AdminCustomers /> },
                  {
                    path: "customers/:customerId",
                    element: <AdminCustomerOrders />,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default appRouter;

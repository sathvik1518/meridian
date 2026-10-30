import { lazy } from "react";
import { Outlet, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import { RequireAuth, RequireRole } from "./components/layout/RouteGuards";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Code splitting: each page below is downloaded only when someone first opens it,
// so the first screen loads faster.
const Dashboard = lazy(() => import("./pages/Dashboard"));

const Products = lazy(() => import("./pages/Products"));

const ProductDetail = lazy(() => import("./pages/ProductDetail"));

const Orders = lazy(() => import("./pages/Orders"));

const Restock = lazy(() => import("./pages/Restock"));

const Team = lazy(() => import("./pages/Team"));

export default function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Everything inside needs a signed-in user. AppShell draws the sidebar + topbar,
            and <Outlet /> inside it shows whichever child route matched. */}
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Nested routes: /products and /products/:productId */}
        <Route path="products" element={<Outlet />}>
          <Route index element={<Products />} />
          <Route path=":productId" element={<ProductDetail />} />
        </Route>

        <Route path="orders" element={<Orders />} />
        <Route path="restock" element={<Restock />} />

        {/* Role-protected route: signed in AND admin */}
        <Route
          path="team"
          element={
            <RequireRole roles={["admin"]}>
              <Team />
            </RequireRole>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

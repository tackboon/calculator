import { createBrowserRouter, Navigate } from "react-router-dom";

import NavLayout from "../layout/nav_layout.component";
import CalculatorPage from "../page/calculator/calculator.component";
import NotFoundPage from "../page/not_found/not_found.component";
// import { sessionLoader } from "./loader";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/trading-calculator" replace={true} />,
  },
  {
    path: "/",
    element: <NavLayout />,
    children: [
      {
        path: "/trading-calculator",
        element: <CalculatorPage />,
        // loader: () => sessionLoader(false),
      },
      // {
      //   path: "/login",
      //   element: (
      //     <RequiredGuestRoute>
      //       <LoginPage />
      //     </RequiredGuestRoute>
      //   ),
      //   loader: () => sessionLoader(false),
      // },
      // {
      //   path: "/register",
      //   element: (
      //     <RequiredGuestRoute>
      //       <RegisterPage />
      //     </RequiredGuestRoute>
      //   ),
      //   loader: () => sessionLoader(false),
      // },
      // {
      //   path: "/forgot-password",
      //   element: (
      //     <RequiredGuestRoute>
      //       <ForgotPasswordPage />
      //     </RequiredGuestRoute>
      //   ),
      //   loader: () => sessionLoader(false),
      // },
      // {
      //   path: "/reset-password",
      //   element: <ResetPasswordPage />,
      //   loader: (args) => resetPasswordLoader(args),
      // },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default router;

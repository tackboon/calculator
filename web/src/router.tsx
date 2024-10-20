import { createBrowserRouter, Navigate } from "react-router-dom";

import NavLayout from "./layout/nav_layout.component";
import LoginPage from "./page/auth/login.component";
import RegisterPage from "./page/auth/register.component";
import CalculatorPage from "./page/calculator/calculator.component";
import ForgotPasswordPage from "./page/auth/forgot.component";
import StockJournalPage from "./page/journal/stock_journal.component";
import NotFoundPage from "./page/not_found/not_found.component";
import PortfolioPage from "./page/portfolio/portfolio.component";
import ResetPasswordPage from "./page/auth/reset.component";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/calculator" replace={true} />,
  },
  {
    path: "/",
    element: <NavLayout />,
    children: [
      {
        path: "/calculator",
        element: <CalculatorPage />,
      },
      {
        path: "/journal",
        element: <StockJournalPage />,
      },
      {
        path: "/portfolio",
        element: <PortfolioPage />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default router;

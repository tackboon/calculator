import { createBrowserRouter, Navigate } from "react-router-dom";

import CalculatorPage from "./page/calculator/calculator.component";
import LoginPage from "./page/login/login.component";
import NotFoundPage from "./page/not_found/not_found.component";
import NavLayout from "./layout/nav_layout.component";
import StockJournalPage from "./page/journal/stock_journal.component";
import PortfolioPage from "./page/portfolio/portfolio.component";

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
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default router;

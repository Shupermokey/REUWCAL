// src/routes/routesConfig.js
import { TIERS } from "@/constants/tiers";

// ✅ Lazy imports for better performance
import React from "react";

const LoginPage = React.lazy(() => import("@/pages/LoginPage"));
const RegisterPage = React.lazy(() => import("@/pages/RegisterPage"));
const MagicLinkPage = React.lazy(() => import("@/pages/MagicLinkPage"));
const VerifyEmail = React.lazy(() => import("@/pages/VerifyEmail"));
const Home = React.lazy(() => import("@/pages/Home"));
const DashboardPage = React.lazy(() => import("@/pages/DashboardPage"));
const PricingPage = React.lazy(() => import("@/pages/PricingPage"));
const ProfilePage = React.lazy(() => import("@/pages/ProfilePage"));
const BaselinePage = React.lazy(() => import("@/pages/BaselinePage"));
const Unauthorized = React.lazy(() => import("@/pages/Unauthorized"));
const DeveloperTools = React.lazy(() => import("@/pages/DeveloperTools"));

export const routesConfig = [
  // Public
  { path: "/", element: <LoginPage />, isPublic: true },
  { path: "/login", element: <LoginPage />, isPublic: true },
  { path: "/register", element: <RegisterPage />, isPublic: true },
  { path: "/magic-link", element: <MagicLinkPage />, isPublic: true },
  { path: "/pricing", element: <PricingPage />, isPublic: true },

  // Authenticated (Free tier)
  {
    element: TIERS.Free,
    children: [
      { path: "/verify-email", element: <VerifyEmail /> },
      { path: "/home", element: <Home /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/profile", element: <ProfilePage /> },
      { path: "/baseline", element: <BaselinePage /> },
    ],
  },

  // Higher-tier (Developer)
  {
    element: TIERS.Developer,
    children: [{ path: "/developer-tools", element: <DeveloperTools /> }],
  },

  // Other
  { path: "/unauthorized", element: <Unauthorized />, isPublic: true },
];

// You can extend your routesConfig easily later:
// {
//   path: "/baseline",
//   element: <BaselinePage />,
//   title: "Baseline Assumptions",
//   icon: "📊",
//   showInSidebar: true
// }


"use client";

import dynamic from "next/dynamic";

const Dashboard = dynamic(() => import("@/components/Dashboard"), {
  ssr: false,
  loading: () => (
    <div className="p-8 space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 bg-gray-200 rounded animate-pulse" />
        <div className="h-28 bg-gray-200 rounded animate-pulse" />
        <div className="h-28 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-96 bg-gray-200 rounded animate-pulse" />
    </div>
  ),
});

export default function DashboardClient() {
  return <Dashboard />;
}

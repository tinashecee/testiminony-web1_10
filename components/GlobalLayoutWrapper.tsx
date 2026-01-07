"use client";

import { usePathname } from "next/navigation";
import Layout from "./Layout";

export default function GlobalLayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/login" || pathname === "/forgot-password";

    if (isAuthPage) {
        return <>{children}</>;
    }

    return <Layout>{children}</Layout>;
}

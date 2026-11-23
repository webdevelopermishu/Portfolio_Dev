import type { Metadata } from "next";
import { ToastProvider } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Dashboard" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "'Inter Variable', ui-sans-serif, system-ui, sans-serif" }}>
      <ToastProvider>{children}</ToastProvider>
    </div>
  );
}

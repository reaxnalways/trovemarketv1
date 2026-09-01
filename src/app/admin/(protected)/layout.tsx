import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";
import { AdminSidebar } from "./admin-sidebar";
import "../admin.css";
import "../admin-refine.css";
import "../image-manager.css";
import "../label.css";
import "../slider-manager.css";
import "../admin-compact.css";
import "../admin-mobile-nav.css";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user || !isAdminEmail(data.user.email)) {
    redirect("/admin/login");
  }

  return (
    <div className="adminAppShell">
      <AdminSidebar />
      <div className="adminMainColumn">{children}</div>
    </div>
  );
}

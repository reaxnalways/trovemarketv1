import { getPublicSiteSettings } from "@/modules/settings/public-settings";
import { AdminSidebarClient } from "./admin-sidebar-client";

export async function AdminSidebar() {
  const settings = await getPublicSiteSettings();
  return <AdminSidebarClient
    siteName={settings.site_name || "Trove Teknoloji"}
    logoUrl={settings.logo_url || null}
    wordmarkUrl={settings.brand_wordmark_url || null}
  />;
}

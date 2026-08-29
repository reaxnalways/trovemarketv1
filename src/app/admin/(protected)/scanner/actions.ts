"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

async function getAdminContext() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user || !isAdminEmail(userData.user.email)) redirect("/admin/login");
  return supabase;
}

function requiredCode(formData: FormData) {
  const code = String(formData.get("productCode") ?? "").trim();
  if (!/^\d{11}$/.test(code)) throw new Error("Geçersiz ürün kodu.");
  return code;
}

export async function updateScannedProduct(formData: FormData) {
  const supabase = await getAdminContext();

  let productCode: string;
  try {
    productCode = requiredCode(formData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ürün güncellenemedi.";
    redirect(`/admin/scanner?error=${encodeURIComponent(message)}`);
  }

  const rawPrice = String(formData.get("price") ?? "").trim().replace(",", ".");
  const price = rawPrice === "" ? null : Number(rawPrice);
  const stockStatus = String(formData.get("stockStatus") ?? "");
  const publicationStatus = String(formData.get("publicationStatus") ?? "");

  if (price !== null && (!Number.isFinite(price) || price < 0)) {
    redirect(`/admin/scanner?code=${productCode}&error=${encodeURIComponent("Fiyat geçersiz.")}`);
  }
  if (!["in_stock", "sold", "reserved"].includes(stockStatus)) {
    redirect(`/admin/scanner?code=${productCode}&error=${encodeURIComponent("Stok durumu geçersiz.")}`);
  }
  if (!["draft", "published", "hidden"].includes(publicationStatus)) {
    redirect(`/admin/scanner?code=${productCode}&error=${encodeURIComponent("Yayın durumu geçersiz.")}`);
  }

  const { error } = await supabase
    .from("products")
    .update({
      price,
      stock_status: stockStatus,
      publication_status: publicationStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("product_code", productCode);

  if (error) {
    redirect(`/admin/scanner?code=${productCode}&error=${encodeURIComponent("Ürün güncellenemedi.")}`);
  }

  redirect(`/admin/scanner?code=${productCode}&updated=1`);
}

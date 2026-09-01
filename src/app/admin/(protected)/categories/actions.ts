"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAdminEmail } from "@/modules/auth/admin-access";

async function adminClient() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || !isAdminEmail(data.user.email)) redirect("/admin/login");
  return supabase;
}

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function parseValues(form: FormData) {
  const name = text(form, "name");
  const slug = slugify(text(form, "slug") || name);
  const codePrefix = text(form, "codePrefix").toUpperCase();
  const description = text(form, "description") || null;
  const sortOrder = Number(text(form, "sortOrder") || "0");

  if (name.length < 2 || name.length > 80) throw new Error("Kategori adı 2-80 karakter olmalı.");
  if (!slug) throw new Error("Geçerli bir kategori bağlantısı oluşturulamadı.");
  if (!/^[A-Z]{3}$/.test(codePrefix)) throw new Error("Ürün kodu ön eki tam 3 büyük harf olmalı. Örn: TAB");
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) throw new Error("Sıralama 0-9999 arasında tam sayı olmalı.");

  return { name, slug, code_prefix: codePrefix, description, sort_order: sortOrder };
}

function refreshCategoryPaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/listings/new");
  revalidatePath("/admin/listings");
  if (slug) revalidatePath(`/kategori/${slug}`);
}

export async function createCategory(form: FormData) {
  const supabase = await adminClient();
  const values = parseValues(form);
  const { error } = await supabase.from("categories").insert({ ...values, is_active: true });
  if (error) {
    if (error.code === "23505") throw new Error("Bu kategori bağlantısı veya ürün kodu ön eki zaten kullanılıyor.");
    throw new Error("Kategori eklenemedi.");
  }
  refreshCategoryPaths(values.slug);
}

export async function updateCategory(form: FormData) {
  const supabase = await adminClient();
  const id = text(form, "id");
  if (!id) throw new Error("Kategori bulunamadı.");
  const values = parseValues(form);

  const [{ count }, { data: current }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id),
    supabase.from("categories").select("slug,code_prefix").eq("id", id).single(),
  ]);
  if (!current) throw new Error("Kategori bulunamadı.");
  if ((count ?? 0) > 0 && values.code_prefix !== current.code_prefix) {
    throw new Error("Bu kategoride ürün bulunduğu için ürün kodu ön eki değiştirilemez.");
  }

  const { error } = await supabase.from("categories").update({ ...values, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) {
    if (error.code === "23505") throw new Error("Bu kategori bağlantısı veya ürün kodu ön eki zaten kullanılıyor.");
    throw new Error("Kategori güncellenemedi.");
  }
  refreshCategoryPaths(current.slug);
  refreshCategoryPaths(values.slug);
}

export async function toggleCategory(form: FormData) {
  const supabase = await adminClient();
  const id = text(form, "id");
  const active = text(form, "active") === "true";
  const { data, error } = await supabase
    .from("categories")
    .update({ is_active: !active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("slug")
    .single();
  if (error) throw new Error("Kategori görünürlüğü güncellenemedi.");
  refreshCategoryPaths(data?.slug);
}

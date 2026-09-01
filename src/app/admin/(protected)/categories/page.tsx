import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createCategory, toggleCategory, updateCategory } from "./actions";

type Props = { searchParams: Promise<{ error?: string; created?: string; updated?: string }> };

export default async function AdminCategoriesPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("categories")
    .select("id,name,slug,code_prefix,description,is_active,sort_order,products(count)")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  const categories = data ?? [];

  return (
    <main className="adminShell adminShellWide adminReferencePage">
      <header className="adminReferenceHeader">
        <div>
          <span className="adminReferenceEyebrow">ÜRÜN YÖNETİMİ</span>
          <h1 className="adminPageTitle">Kategoriler</h1>
          <p className="adminLead">Yeni ürün kategorisi ekle, sırasını değiştir veya müşteri sitesinde gizle. Aktif kategoriler yeni ürün formunda otomatik görünür.</p>
        </div>
        <nav className="adminReferenceNav" aria-label="Ürün yönetimi">
          <Link href="/admin/listings">Ürünler</Link>
          <Link href="/admin/listings/new">Yeni ürün</Link>
          <Link className="isActive" href="/admin/categories">Kategoriler</Link>
        </nav>
      </header>

      {params.error ? <p className="adminError">{params.error}</p> : null}
      {params.created ? <p className="adminSuccess"><strong>{params.created}</strong> kategorisi eklendi.</p> : null}
      {params.updated ? <p className="adminSuccess"><strong>{params.updated}</strong> güncellendi.</p> : null}

      <div className="adminReferenceToolGrid">
        <details className="adminReferenceTool" open={Boolean(params.error)}>
          <summary><span><strong>Yeni kategori ekle</strong><small>Ad, bağlantı ve 3 harfli ürün kodu ön eki belirle.</small></span><b>+</b></summary>
          <form className="adminReferenceForm" action={createCategory}>
            <label className="adminField">Kategori adı<input name="name" required placeholder="Tablet" /></label>
            <label className="adminField">URL slug<input name="slug" placeholder="tablet · boşsa otomatik" /><small>Boş bırakırsan kategori adından otomatik oluşturulur.</small></label>
            <label className="adminField">Ürün kodu ön eki<input name="codePrefix" required maxLength={3} minLength={3} pattern="[A-Za-z]{3}" placeholder="TAB" autoCapitalize="characters" /><small>Tam 3 harf. Örn: TAB, KON, KAM.</small></label>
            <label className="adminField">Sıra<input name="sortOrder" type="number" min="0" max="9999" defaultValue="60" /></label>
            <label className="adminField adminFieldWide">Açıklama<input name="description" placeholder="Kategori sayfasında kullanılacak kısa açıklama" /></label>
            <div className="adminReferenceFormActions"><button className="adminButton" type="submit">Kategoriyi ekle</button></div>
          </form>
        </details>
      </div>

      <section className="adminReferenceList">
        <div className="adminReferenceListHeader"><h2>Kategori listesi</h2><span>{categories.length} kategori</span></div>
        {categories.length ? categories.map((category) => {
          const productCount = Array.isArray(category.products) ? Number(category.products[0]?.count ?? 0) : Number((category.products as { count?: number } | null)?.count ?? 0);
          return (
            <details className="adminReferenceRow" key={category.id}>
              <summary>
                <div className="adminReferenceRowMain">
                  <span className="productCode">{category.code_prefix}</span>
                  <strong>{category.name}</strong>
                  <small>/kategori/{category.slug} · {productCount} ürün</small>
                </div>
                <div className="adminReferenceRowMeta">
                  <span>{category.is_active ? "Aktif" : "Gizli"}</span>
                  <span>Sıra {category.sort_order}</span>
                  <b>Düzenle</b>
                </div>
              </summary>
              <div className="adminReferenceRowEditor">
                <form className="adminReferenceForm" action={updateCategory}>
                  <input type="hidden" name="id" value={category.id} />
                  <label className="adminField">Kategori adı<input name="name" required defaultValue={category.name} /></label>
                  <label className="adminField">URL slug<input name="slug" required defaultValue={category.slug} /></label>
                  <label className="adminField">Ürün kodu ön eki<input name="codePrefix" required maxLength={3} minLength={3} pattern="[A-Za-z]{3}" defaultValue={category.code_prefix} readOnly={productCount > 0} /><small>{productCount > 0 ? "Ürün bulunan kategoride ön ek sabitlenir." : "Tam 3 harf."}</small></label>
                  <label className="adminField">Sıra<input name="sortOrder" type="number" min="0" max="9999" defaultValue={category.sort_order} /></label>
                  <label className="adminField adminFieldWide">Açıklama<input name="description" defaultValue={category.description ?? ""} /></label>
                  <div className="adminReferenceFormActions"><button className="adminButton" type="submit">Kaydet</button></div>
                </form>
                <div className="adminInlineActions">
                  <form action={toggleCategory}><input type="hidden" name="id" value={category.id} /><input type="hidden" name="active" value={String(category.is_active)} /><button className="adminButton adminButtonSecondary" type="submit">{category.is_active ? "Müşteri sitesinde gizle" : "Tekrar göster"}</button></form>
                  {category.is_active ? <Link className="adminButton adminButtonSecondary" href={`/kategori/${category.slug}`} target="_blank">Kategori sayfasını aç ↗</Link> : null}
                </div>
              </div>
            </details>
          );
        }) : <p className="emptyState">Kategori bulunamadı.</p>}
      </section>
    </main>
  );
}

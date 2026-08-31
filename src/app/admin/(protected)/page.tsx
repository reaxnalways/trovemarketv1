import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { publishListing } from "./actions";

type AdminHomePageProps = { searchParams: Promise<{ created?: string; published?: string; error?: string }> };

export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  const { created, published, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [draftResult,totalResult,publishedResult,soldResult,activeServiceResult,activePurchaseResult] = await Promise.all([
    supabase.from("products").select("id,product_code,title,price,created_at").eq("publication_status","draft").order("created_at",{ascending:false}).limit(5),
    supabase.from("products").select("id",{count:"exact",head:true}),
    supabase.from("products").select("id",{count:"exact",head:true}).eq("publication_status","published"),
    supabase.from("products").select("id",{count:"exact",head:true}).eq("stock_status","sold"),
    supabase.from("technical_service_records").select("id",{count:"exact",head:true}).is("archived_at",null),
    supabase.from("purchase_requests").select("id",{count:"exact",head:true}).in("status",["new","contacted","awaiting_payment","paid","preparing","shipped"]),
  ]);
  const drafts=draftResult.data??[];
  const activeOrders=Number(activePurchaseResult.count??0);
  const attentionCount=drafts.length+Number(activeServiceResult.count??0)+activeOrders;

  return <main className="adminShell adminShellWide adminDashboardShell">
    <header className="adminDashboardHeader"><div><span className="adminDashboardEyebrow">TROVE YÖNETİM</span><h1>Genel Bakış</h1><p>Mağazada bugün yapacağın işlemlere hızlıca ulaş.</p></div><Link className="adminDashboardSiteLink" href="/" target="_blank">Müşteri sitesini aç ↗</Link></header>
    {created?<p className="adminSuccess">Taslak oluşturuldu: <strong>{created}</strong></p>:null}{published?<p className="adminSuccess">Ürün yayınlandı.</p>:null}{error?<p className="adminError">{error}</p>:null}

    <section className="adminDailyActions" aria-label="Hızlı işlemler">
      <Link className="adminDailyAction adminDailyActionPrimary" href="/admin/listings/new"><span className="adminDailyActionIcon">＋</span><span><strong>Yeni ürün ekle</strong><small>İlan oluştur ve yayınla</small></span></Link>
      <Link className="adminDailyAction" href="/admin/purchases"><span className="adminDailyActionIcon">▣</span><span><strong>Siparişler</strong><small>{activeOrders} aktif sipariş</small></span></Link>
      <Link className="adminDailyAction" href="/admin/scan"><span className="adminDailyActionIcon">⌗</span><span><strong>Barkod tara</strong><small>Ürünü anında bul</small></span></Link>
      <Link className="adminDailyAction" href="/admin/technical-service#yeni-kayit"><span className="adminDailyActionIcon">＋</span><span><strong>Servis kaydı aç</strong><small>Yeni cihaz kabul et</small></span></Link>
    </section>

    <section className="adminOverviewGrid">
      <Link href="/admin/listings"><span>Toplam ürün</span><strong>{totalResult.count??0}</strong><small>Ürünleri yönet →</small></Link>
      <Link href="/admin/listings?publication=published"><span>Yayındaki ürün</span><strong>{publishedResult.count??0}</strong><small>Yayını kontrol et →</small></Link>
      <Link href="/admin/purchases"><span>Aktif sipariş</span><strong>{activeOrders}</strong><small>Sipariş akışını yönet →</small></Link>
      <Link className={attentionCount?"adminOverviewAttention":""} href="/admin/purchases"><span>İşlem bekleyen</span><strong>{attentionCount}</strong><small>{drafts.length} taslak · {activeServiceResult.count??0} servis · {activeOrders} sipariş</small></Link>
    </section>

    <div className="adminDashboardColumns">
      <section className="adminDashboardPanel"><div className="adminDashboardPanelHead"><div><span className="adminDashboardEyebrow">GÜNLÜK İŞ</span><h2>Taslak ürünler</h2></div><Link href="/admin/listings?publication=draft">Tümünü gör →</Link></div>{drafts.length?<div className="adminCompactList">{drafts.map(draft=><article className="adminCompactRow" key={draft.id}><div><span>{draft.product_code}</span><strong>{draft.title}</strong><small>{draft.price==null?"Fiyat girilmedi":`${Number(draft.price).toLocaleString("tr-TR")} ₺`}</small></div><div className="adminCompactActions"><Link href={`/admin/listings/${draft.id}`}>Düzenle</Link><form action={publishListing}><input name="productId" type="hidden" value={draft.id}/><button type="submit">Yayınla</button></form></div></article>)}</div>:<div className="adminDashboardEmpty">Yayınlanmayı bekleyen taslak ürün yok.</div>}</section>

      <section className="adminDashboardPanel"><div className="adminDashboardPanelHead"><div><span className="adminDashboardEyebrow">YÖNETİM</span><h2>Sık kullanılanlar</h2></div></div><div className="adminManagementLinks"><Link href="/admin/purchases"><strong>Siparişler</strong><span>Ödeme, hazırlık, kargo ve teslimat</span><b>›</b></Link><Link href="/admin/listings"><strong>Ürünler</strong><span>Fiyat, stok ve yayın yönetimi</span><b>›</b></Link><Link href="/admin/technical-service"><strong>Teknik servis</strong><span>Kayıtlar, durumlar ve arşiv</span><b>›</b></Link><Link href="/admin/trade-in"><strong>Takas</strong><span>Cihaz ve maliyet referansları</span><b>›</b></Link><Link href="/admin/settings"><strong>Site ayarları</strong><span>Marka, iletişim ve görünüm</span><b>›</b></Link></div></section>
    </div>
  </main>;
}

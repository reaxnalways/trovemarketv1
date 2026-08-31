import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

const statusLabels: Record<string,string> = { new:"Yeni", contacted:"İletişime geçildi", awaiting_payment:"Ödeme bekleniyor", paid:"Ödendi", preparing:"Hazırlanıyor", shipped:"Kargolandı", completed:"Tamamlandı", cancelled:"İptal" };
const activeStatuses = ["new","contacted","awaiting_payment","paid","preparing","shipped"];

type Props = { searchParams: Promise<{ status?: string; q?: string }> };

export default async function PurchasesPage({ searchParams }: Props) {
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  let request = supabase.from("purchase_requests").select("id,order_number,product_code,product_title,product_price,customer_name,customer_phone,customer_email,city,district,invoice_type,status,created_at,status_changed_at").order("created_at",{ascending:false}).limit(150);
  if (query.status && statusLabels[query.status]) request = request.eq("status", query.status);
  const { data } = await request;
  const term = (query.q ?? "").trim().toLocaleLowerCase("tr-TR");
  const allRows = data ?? [];
  const rows = term ? allRows.filter(row => [row.order_number,row.product_code,row.product_title,row.customer_name,row.customer_phone,row.customer_email].some(value => String(value ?? "").toLocaleLowerCase("tr-TR").includes(term))) : allRows;
  const counts = Object.fromEntries(Object.keys(statusLabels).map(status => [status, allRows.filter(row=>row.status===status).length]));
  const activeCount = allRows.filter(row=>activeStatuses.includes(row.status)).length;

  return <main className="adminShell adminShellWide">
    <header className="adminPageHeader"><div><h1 className="adminPageTitle">Siparişler</h1><p className="adminLead">Müşteri satın alma talebinden ödeme, hazırlık, kargo ve tamamlanmaya kadar sipariş akışı.</p></div><Link className="adminButton adminButtonSecondary" href="/admin/settings/company">Satın alma ayarları</Link></header>
    <section className="adminOverviewGrid" style={{marginTop:18}}><Link href="/admin/purchases"><span>Aktif sipariş</span><strong>{activeCount}</strong><small>Tüm aktif süreçler</small></Link><Link href="/admin/purchases?status=new"><span>Yeni</span><strong>{counts.new??0}</strong><small>İşlem bekliyor</small></Link><Link href="/admin/purchases?status=awaiting_payment"><span>Ödeme bekleyen</span><strong>{counts.awaiting_payment??0}</strong><small>Ürün rezerve edilir</small></Link><Link href="/admin/purchases?status=shipped"><span>Kargoda</span><strong>{counts.shipped??0}</strong><small>Teslimat bekliyor</small></Link></section>
    <form className="adminListingFilters" style={{marginTop:18}}><label className="adminField"><span>Arama</span><input name="q" defaultValue={query.q??""} placeholder="Sipariş no, ürün, müşteri, telefon..."/></label><label className="adminField"><span>Durum</span><select name="status" defaultValue={query.status??""}><option value="">Tüm durumlar</option>{Object.entries(statusLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label><button className="adminButton" type="submit">Filtrele</button><Link className="adminButton adminButtonSecondary" href="/admin/purchases">Temizle</Link></form>
    <div className="adminTableCard" style={{marginTop:16}}>{rows.length?rows.map(row=><article className="adminProductRow" key={row.id}><div className="adminProductMain"><small>{row.order_number} · {new Date(row.created_at).toLocaleString("tr-TR")}</small><strong>{row.product_title}</strong><span>{row.customer_name} · {row.customer_phone}</span><small>{row.product_code} · {row.customer_email} · {row.district}/{row.city}</small></div><div className="adminProductMeta"><span>{row.product_price==null?"Fiyat yok":`${Number(row.product_price).toLocaleString("tr-TR")} ₺`}</span><span>{row.invoice_type==="company"?"Kurumsal":"Bireysel"}</span><span>{statusLabels[row.status]??row.status}</span></div><div className="adminInlineActions"><Link className="adminButton adminButtonSecondary" href={`/admin/purchases/${row.id}`}>Siparişi Aç</Link></div></article>):<div className="adminDashboardEmpty">Bu filtrede sipariş bulunamadı.</div>}</div>
  </main>;
}

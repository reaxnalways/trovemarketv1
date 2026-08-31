import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { updatePurchaseOrder } from "../actions";

const statusLabels: Record<string,string> = { new:"Yeni", contacted:"İletişime geçildi", awaiting_payment:"Ödeme bekleniyor", paid:"Ödendi", preparing:"Hazırlanıyor", shipped:"Kargolandı", completed:"Tamamlandı", cancelled:"İptal" };
const flow = ["new","contacted","awaiting_payment","paid","preparing","shipped","completed"];

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> };

export default async function PurchaseOrderDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [{ data: order }, { data: history }] = await Promise.all([
    supabase.from("purchase_requests").select("*").eq("id",id).maybeSingle(),
    supabase.from("purchase_status_history").select("id,from_status,to_status,note,created_at").eq("purchase_request_id",id).order("created_at",{ascending:false}),
  ]);
  if (!order) notFound();
  const currentIndex = flow.indexOf(order.status);

  return <main className="adminShell adminShellWide">
    <header className="adminPageHeader"><div><Link className="adminTextLink" href="/admin/purchases">← Siparişler</Link><h1 className="adminPageTitle" style={{marginTop:8}}>{order.order_number}</h1><p className="adminLead">{order.product_title} · {order.product_code}</p></div><Link className="adminButton adminButtonSecondary" href={`/ilan/${order.product_code}`} target="_blank">İlanı Aç ↗</Link></header>
    {query.saved?<p className="adminSuccess">Sipariş durumu kaydedildi.</p>:null}
    {query.error==="reserved"?<p className="adminError">Bu ürün başka aktif sipariş için rezerve edilmiş. Önce diğer sipariş sürecini kontrol et.</p>:query.error?<p className="adminError">Sipariş güncellenemedi.</p>:null}

    <section className="adminDashboardCard" style={{marginTop:18}}><div className="adminDashboardPanelHead" style={{padding:0,border:0,marginBottom:16}}><div><span className="adminDashboardEyebrow">SİPARİŞ AKIŞI</span><h2 style={{margin:"5px 0 0"}}>{statusLabels[order.status]??order.status}</h2></div><strong>{order.product_price==null?"Fiyat yok":`${Number(order.product_price).toLocaleString("tr-TR")} ₺`}</strong></div><div className="adminFlowSteps" style={{gridTemplateColumns:"repeat(7,minmax(0,1fr))"}}>{flow.map((status,index)=><span key={status} style={{opacity:order.status==="cancelled"?.35:index<=currentIndex?1:.45,borderColor:index===currentIndex?"#6f829e":undefined}}>{index+1}. {statusLabels[status]}</span>)}</div>{order.status==="cancelled"?<p className="adminError" style={{marginTop:14}}>Sipariş iptal edildi.</p>:null}</section>

    <div className="adminDashboardColumns" style={{marginTop:14}}>
      <section className="adminDashboardCard"><h2 style={{marginTop:0}}>Müşteri & Teslimat</h2><dl className="listingSpecs"><div><dt>Ad Soyad</dt><dd>{order.customer_name}</dd></div><div><dt>Telefon</dt><dd><a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a></dd></div><div><dt>E-posta</dt><dd><a href={`mailto:${order.customer_email}`}>{order.customer_email}</a></dd></div><div><dt>Adres</dt><dd>{order.address_line}</dd></div><div><dt>İlçe / İl</dt><dd>{order.district} / {order.city}</dd></div>{order.postal_code?<div><dt>Posta kodu</dt><dd>{order.postal_code}</dd></div>:null}</dl></section>
      <section className="adminDashboardCard"><h2 style={{marginTop:0}}>Fatura & Ödeme</h2><dl className="listingSpecs"><div><dt>Fatura tipi</dt><dd>{order.invoice_type==="company"?"Kurumsal":"Bireysel"}</dd></div><div><dt>Fatura adı</dt><dd>{order.invoice_name}</dd></div>{order.invoice_company?<div><dt>Firma</dt><dd>{order.invoice_company}</dd></div>:null}{order.tax_office?<div><dt>Vergi dairesi</dt><dd>{order.tax_office}</dd></div>:null}{order.tax_number?<div><dt>Vergi no</dt><dd>{order.tax_number}</dd></div>:null}<div><dt>Ödeme</dt><dd>Havale / EFT</dd></div>{order.payment_received_at?<div><dt>Ödeme alındı</dt><dd>{new Date(order.payment_received_at).toLocaleString("tr-TR")}</dd></div>:null}</dl></section>
    </div>

    <section className="adminDashboardCard" style={{marginTop:14}}><h2 style={{marginTop:0}}>Sipariş İşlemi</h2><p className="adminLead">Ödeme bekleniyor aşamasına geçtiğinde ürün otomatik rezerve edilir. Tamamlandığında satıldı olur; iptalde rezervasyon kaldırılır.</p><form action={updatePurchaseOrder} className="adminListingForm"><input type="hidden" name="purchaseId" value={order.id}/><label className="adminField"><span>Durum</span><select name="status" defaultValue={order.status}>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label className="adminField"><span>Kargo takip kodu</span><input name="trackingCode" defaultValue={order.tracking_code??""} placeholder="Kargolandığında gir"/></label><label className="adminField adminFieldWide"><span>Admin notu</span><textarea name="adminNote" defaultValue={order.admin_note??""} maxLength={1000} placeholder="Ödeme, müşteri görüşmesi veya teslimat notu"/></label><div className="adminFormActions adminFieldWide"><button className="adminButton" type="submit">Siparişi Güncelle</button></div></form></section>

    <section className="adminDashboardCard" style={{marginTop:14}}><h2 style={{marginTop:0}}>Sipariş Geçmişi</h2>{history?.length?<div className="adminCompactList">{history.map(item=><article className="adminCompactRow" key={item.id}><div><span>{new Date(item.created_at).toLocaleString("tr-TR")}</span><strong>{item.from_status?`${statusLabels[item.from_status]??item.from_status} → `:""}{statusLabels[item.to_status]??item.to_status}</strong>{item.note?<small>{item.note}</small>:null}</div></article>)}</div>:<div className="adminDashboardEmpty">Henüz durum değişikliği yok.</div>}</section>
  </main>;
}

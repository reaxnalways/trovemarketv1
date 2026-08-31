import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

const statusLabels: Record<string,string> = { new:"Yeni", contacted:"İletişime geçildi", awaiting_payment:"Ödeme bekleniyor", paid:"Ödendi", cancelled:"İptal", completed:"Tamamlandı" };

export default async function PurchasesPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("purchase_requests").select("id,product_code,product_title,product_price,customer_name,customer_phone,customer_email,city,district,invoice_type,status,created_at").order("created_at",{ascending:false}).limit(100);
  const rows = data ?? [];
  return <main className="adminShell adminShellWide"><header className="adminPageHeader"><div><h1 className="adminPageTitle">Satın Alma Talepleri</h1><p className="adminLead">Havale/EFT ile oluşturulan müşteri satın alma talepleri.</p></div><Link className="adminButton adminButtonSecondary" href="/admin/settings/company">Satın alma ayarları</Link></header><div className="adminTableCard" style={{marginTop:20}}>{rows.length?rows.map(row=><article className="adminProductRow" key={row.id}><div className="adminProductMain"><small>{row.product_code} · {new Date(row.created_at).toLocaleString("tr-TR")}</small><strong>{row.product_title}</strong><span>{row.customer_name} · {row.customer_phone}</span><small>{row.customer_email} · {row.district}/{row.city}</small></div><div className="adminProductMeta"><span>{row.product_price==null?"Fiyat yok":`${Number(row.product_price).toLocaleString("tr-TR")} ₺`}</span><span>{row.invoice_type==="company"?"Kurumsal fatura":"Bireysel fatura"}</span><span>{statusLabels[row.status]??row.status}</span></div></article>):<div className="adminDashboardEmpty">Henüz satın alma talebi yok.</div>}</div></main>;
}

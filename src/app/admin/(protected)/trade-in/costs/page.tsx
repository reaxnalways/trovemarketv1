import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { updateTradeInCost } from "./actions";

export default async function TradeInCostsPage(){
 const supabase=await createSupabaseServerClient();
 const {data}=await supabase.from("trade_in_cost_references").select("code,label,amount,is_active,updated_at").order("label");
 const costs=data??[];
 return <main className="adminShell adminShellWide">
  <header className="adminTopbar"><div><h1 className="adminPageTitle">Masraf Referansları</h1><p className="adminLead">Takas teklifinden düşülecek ekran, pil, kasa, arıza ve kozmetik maliyetlerini tek yerden yönet.</p></div><Link className="adminButton adminButtonSecondary" href="/admin/trade-in">Cihaz Fiyatları</Link></header>
  <section className="adminDashboardCard"><p className="adminLead" style={{margin:0}}>Bu tutarlar tüm cihazlarda ortak varsayılan masraflardır. Örneğin ekran değişimi 5.000 ₺ ise müşteri ekranı kırık seçtiğinde bu tutar, cihazın bölgesine göre seçilmiş güncel piyasa fiyatından ve Trove kâr marjından sonra düşülür.</p></section>
  <section className="listingSection"><div className="sectionHeading"><div><h2>Referans maliyetler</h2><p>{costs.length} kalem</p></div></div><div className="adminDraftList">{costs.map((cost)=><article className="adminDraftItem" key={cost.code}><div><span className="productCode">{cost.code}</span><h3>{cost.label}</h3><p>Mevcut: {Number(cost.amount).toLocaleString("tr-TR")} ₺</p></div><form className="adminInlineActions" action={updateTradeInCost}><input type="hidden" name="code" value={cost.code}/><label className="adminField" style={{minWidth:160}}>Yeni tutar<input name="amount" inputMode="decimal" defaultValue={Number(cost.amount)} required/></label><button className="adminButton" type="submit">Kaydet</button></form></article>)}</div></section>
 </main>
}

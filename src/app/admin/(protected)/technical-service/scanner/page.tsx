import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { updateTechnicalServiceStatus } from "../actions";
import { TechnicalServiceScannerClient } from "./scanner-client";

type Props = { searchParams: Promise<{ code?: string; updated?: string; error?: string }> };
const SERVICE_LABELS: Record<string, string> = { phone: "Telefon", computer: "Bilgisayar", laptop: "Laptop", playstation: "PlayStation" };
const STATUS_LABELS: Record<string, string> = { in_progress: "Yapılmakta", completed: "Yapıldı", notify_customer: "Haber verilecek" };

export default async function TechnicalServiceScannerPage({ searchParams }: Props) {
  const { code, updated, error } = await searchParams;
  const lookup = String(code ?? "").trim();
  const supabase = await createSupabaseServerClient();
  let record = null;
  if (lookup) {
    const safe = lookup.replace(/,/g, "");
    const { data } = await supabase.from("technical_service_records").select("id,service_type,service_status,service_code,barcode,first_name,last_name,phone,complaint,fault_description,archived_at").or(`barcode.eq.${safe},service_code.eq.${safe}`).maybeSingle();
    record = data;
  }

  return <main className="adminShell adminShellWide">
    <div className="adminPageHeader"><div><p className="eyebrow">TEKNİK SERVİS</p><h1 className="adminPageTitle">Servis Barkodu Tara</h1></div><Link className="adminButton adminButtonSecondary" href="/admin/technical-service">Servise dön</Link></div>
    {updated ? <p className="adminSuccess">Servis durumu güncellendi.</p> : null}{error ? <p className="adminError">{error}</p> : null}
    <TechnicalServiceScannerClient />
    {lookup && !record ? <p className="adminError" style={{ marginTop: 18 }}>Bu barkod veya servis koduyla eşleşen kayıt bulunamadı.</p> : null}
    {record ? <section className="listingSection"><div className="sectionHeading"><div><p className="eyebrow">BULUNAN SERVİS</p><h2>{record.first_name} {record.last_name}</h2></div><span className="productCode">{record.service_code}</span></div>
      <article className="adminTableCard"><div className="adminProductRow"><div className="adminProductMain"><strong>{SERVICE_LABELS[record.service_type] ?? record.service_type}</strong><small>{record.phone} · Barkod {record.barcode}</small><p><strong>Durum:</strong> {STATUS_LABELS[record.service_status] ?? record.service_status}</p><p><strong>Müşteri şikayeti:</strong> {record.complaint || "Belirtilmemiş"}</p><p><strong>Arıza / Teknik Tespit:</strong> {record.fault_description || "Henüz tespit girilmedi"}</p>{record.archived_at ? <p className="adminError">Bu kayıt arşivlenmiş.</p> : null}</div></div></article>
      <section className="adminDashboardCard"><p className="eyebrow">HIZLI İŞLEM</p><h2>Servis durumunu değiştir</h2>{record.archived_at ? <p>Arşivlenmiş kayıtta önce geri yükleme yap.</p> : <form action={updateTechnicalServiceStatus} className="adminListingForm"><input type="hidden" name="recordId" value={record.id}/><input type="hidden" name="returnCode" value={record.barcode}/><label className="adminField adminFieldWide">Durum<select name="serviceStatus" defaultValue={record.service_status}><option value="in_progress">Yapılmakta</option><option value="completed">Yapıldı</option><option value="notify_customer">Haber verilecek</option></select></label><div className="adminFormActions adminFieldWide"><button className="adminButton" type="submit">Durumu kaydet</button><Link className="adminButton adminButtonSecondary" href={`/admin/technical-service?q=${encodeURIComponent(record.service_code)}#servis-kayitlari`}>Tam kaydı aç</Link><Link className="adminButton adminButtonSecondary" href={`/admin/technical-service/labels/${record.service_code}`}>Etiketi yazdır</Link></div></form>}</section>
    </section> : null}
  </main>;
}

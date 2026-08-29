import Link from "next/link";
import { notFound } from "next/navigation";
import { Code39Barcode } from "@/components/code39-barcode";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { PrintButton } from "./print-button";

const SERVICE_LABELS: Record<string, string> = {
  phone: "Telefon",
  computer: "Bilgisayar",
  laptop: "Laptop",
  playstation: "PlayStation",
};

type ServiceLabelPageProps = { params: Promise<{ serviceCode: string }> };

export default async function ServiceLabelPage({ params }: ServiceLabelPageProps) {
  const { serviceCode } = await params;
  if (!/^TS-(TEL|BIL|LAP|PS)-\d{6}$/.test(serviceCode)) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: record } = await supabase
    .from("technical_service_records")
    .select("service_type,service_code,barcode,first_name,last_name,phone")
    .eq("service_code", serviceCode)
    .maybeSingle();

  if (!record) notFound();

  return (
    <main className="adminShell">
      <header className="adminTopbar printHidden">
        <div><p className="eyebrow">TEKNİK SERVİS ETİKETİ</p><h1 className="adminPageTitle">{record.service_code}</h1></div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="adminButton adminButtonSecondary" href="/admin/technical-service">Servise dön</Link>
          <PrintButton />
        </div>
      </header>

      <section className="troveLabel">
        <div className="troveLabelBrand">TROVE TEKNOLOJİ · TEKNİK SERVİS</div>
        <h2>{record.first_name} {record.last_name}</h2>
        <div className="troveLabelGrid">
          <p><span>Servis</span><strong>{SERVICE_LABELS[record.service_type] ?? record.service_type}</strong></p>
          <p><span>Telefon</span><strong>{record.phone}</strong></p>
          <p><span>Servis kodu</span><strong>{record.service_code}</strong></p>
        </div>
        <div className="troveBarcodeWrap">
          <Code39Barcode value={record.barcode} height={72} />
          <strong>{record.barcode}</strong>
        </div>
        <div className="troveLabelCode">Teknik Servis Barkod No: {record.barcode}</div>
      </section>
    </main>
  );
}

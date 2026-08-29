import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { saveContent } from "./actions";

type Props={searchParams:Promise<{saved?:string;error?:string}>};
export default async function ContentPage({searchParams}:Props){
 const {saved,error}=await searchParams; const supabase=await createSupabaseServerClient();
 const {data}=await supabase.from("site_settings").select("campaign_title,campaign_text,campaign_url,service_intro").eq("id",true).maybeSingle();
 return <main className="adminShell"><div className="adminPageHeader"><div><p className="eyebrow">İÇERİK YÖNETİMİ</p><h1 className="adminPageTitle">Kampanya & Teknik Servis</h1></div><Link className="adminButton adminButtonSecondary" href="/admin">Panele dön</Link></div>{saved?<p className="adminSuccess">İçerikler kaydedildi.</p>:null}{error?<p className="adminError">{error}</p>:null}<section className="adminDashboardCard" style={{marginTop:24}}><form className="adminListingForm" action={saveContent}><label className="adminField adminFieldWide">Kampanya başlığı<input name="campaignTitle" defaultValue={data?.campaign_title??""}/></label><label className="adminField adminFieldWide">Kampanya açıklaması<textarea name="campaignText" defaultValue={data?.campaign_text??""}/></label><label className="adminField adminFieldWide">Kampanya bağlantısı<input name="campaignUrl" defaultValue={data?.campaign_url??""} placeholder="/kategori/telefon veya https://..."/></label><label className="adminField adminFieldWide">Teknik servis açıklaması<textarea name="serviceIntro" defaultValue={data?.service_intro??""}/></label><div className="adminFormActions adminFieldWide"><button className="adminButton" type="submit">İçerikleri kaydet</button></div></form></section></main>;
}

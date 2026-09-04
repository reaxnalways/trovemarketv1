import { NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

const LEGACY_FAULT_MAP:Record<string,string>={display:"screen",touch:"screen",charge:"charging_port",liquid:"liquid_cleaning",audio:"speaker"};

export async function POST(request:Request){
 try{
  const body=await request.json();
  const deviceType=String(body.deviceType??"").trim();
  const brand=String(body.brand??"").trim();
  const model=String(body.model??"").trim();
  const raw=Array.isArray(body.faultCodes)?body.faultCodes.map(String).filter(Boolean):[];
  const faultCodes=Array.from(new Set(raw.map(code=>LEGACY_FAULT_MAP[code]??code)));
  if(!deviceType||!brand||!model||!faultCodes.length)return NextResponse.json({error:"Cihaz, marka, model ve arıza seçimi gerekli."},{status:400});
  const supabase=createPublicSupabaseClient();
  const{data,error}=await supabase.rpc("estimate_service_price",{p_device_type:deviceType,p_brand:brand,p_model:model,p_fault_codes:faultCodes});
  if(error||!data?.length)return NextResponse.json({error:"Tahmini servis fiyatı oluşturulamadı."},{status:404});
  const min=Number(data[0].estimate_min),max=Number(data[0].estimate_max);
  if(max<=0)return NextResponse.json({error:"Bu cihaz için Takas Fiyatları TR değeri veya servis kuralı tanımlı değil."},{status:404});
  return NextResponse.json({min,max});
 }catch{return NextResponse.json({error:"Tahmini servis fiyatı hesaplanamadı."},{status:500})}
}

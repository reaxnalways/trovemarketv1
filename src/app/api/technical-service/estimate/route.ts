import { NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

const LEGACY_FAULT_MAP:Record<string,string>={display:"screen",touch:"screen",charge:"charging_port",liquid:"liquid_cleaning",audio:"speaker"};

export async function POST(request:Request){
 try{
  const body=await request.json();
  const deviceType=String(body.deviceType??"").trim();
  const brand=String(body.brand??"").trim();
  const model=String(body.model??"").trim();
  const storage=String(body.storage??"").trim();
  const color=String(body.color??"").trim();
  const raw:string[]=Array.isArray(body.faultCodes)?body.faultCodes.map((value:unknown)=>String(value)).filter(Boolean):[];
  const faultCodes=Array.from(new Set(raw.map((code:string)=>LEGACY_FAULT_MAP[code]??code)));
  if(!deviceType||!brand||!model||!faultCodes.length)return NextResponse.json({error:"Cihaz, marka, model ve arıza seçimi gerekli."},{status:400});
  const supabase=createPublicSupabaseClient();
  const{data,error}=await supabase.rpc("estimate_service_price",{p_device_type:deviceType,p_brand:brand,p_model:model,p_storage:storage,p_color:color,p_fault_codes:faultCodes});
  if(error||!data?.length)return NextResponse.json({error:"Tahmini servis fiyatı oluşturulamadı."},{status:404});
  const min=Number(data[0].estimate_min),max=Number(data[0].estimate_max);
  if(max<=0)return NextResponse.json({error:"Bu depolama ve renk varyantı için TR referans fiyatı tanımlı değil."},{status:404});
  return NextResponse.json({min,max});
 }catch{return NextResponse.json({error:"Tahmini servis fiyatı hesaplanamadı."},{status:500})}
}

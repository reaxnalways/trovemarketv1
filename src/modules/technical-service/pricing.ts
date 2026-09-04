import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

export type ServicePriceReference={id:string;device_type:string;brand:string;model:string;fault_code:string;fault_label:string;min_price:number;max_price:number};

type ServiceRuleRow={id:string;label:string;service_fault_code:string|null;min_service_price:number|string|null;max_service_price:number|string|null};

export async function listPublicServicePrices():Promise<ServicePriceReference[]>{
 const supabase=createPublicSupabaseClient({noStore:true});
 const {data,error}=await supabase.from("pricing_fault_rules").select("id,label,service_fault_code,min_service_price,max_service_price").eq("is_active",true).not("service_fault_code","is",null).gt("service_pct",0).order("sort_order");
 if(error)return[];
 return ((data??[]) as ServiceRuleRow[]).map(row=>({id:row.id,device_type:"Telefon",brand:"",model:"",fault_code:row.service_fault_code??"",fault_label:row.label,min_price:Number(row.min_service_price??0),max_price:Number(row.max_service_price??0)}));
}

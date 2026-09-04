import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

export type ServicePriceReference={id:string;device_type:string;brand:string;model:string;fault_code:string;fault_label:string;min_price:number;max_price:number};
export async function listPublicServicePrices():Promise<ServicePriceReference[]>{const supabase=createPublicSupabaseClient({noStore:true});const{data,error}=await supabase.rpc("get_service_price_catalog");if(error)return[];return(data??[]).map((row:ServicePriceReference)=>({...row,min_price:Number(row.min_price),max_price:Number(row.max_price)}))}

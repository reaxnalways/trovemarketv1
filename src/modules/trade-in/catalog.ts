import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

export type TradeInCatalogDevice = {
  id: string;
  device_type: string;
  brand: string;
  model: string;
  storage: string;
};

export async function listPublicTradeInDevices(): Promise<TradeInCatalogDevice[]> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase.rpc("get_trade_in_catalog");
  if (error) return [];
  return (data ?? []) as TradeInCatalogDevice[];
}

import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

export type TradeInCatalogDevice = { id: string; device_type: string; brand: string; model: string; storage: string; color: string; has_tr: boolean; has_passport: boolean; has_international: boolean };
export type TradeInCostOption = { code: string; label: string; amount: number; category: "repair" | "accessory"; sort_order: number; form_field?: string | null; form_value?: string | null };

export async function listPublicTradeInDevices(): Promise<TradeInCatalogDevice[]> {
  const supabase = createPublicSupabaseClient({ noStore: true });
  const { data, error } = await supabase.rpc("get_trade_in_catalog");
  if (error) return [];
  return (data ?? []) as TradeInCatalogDevice[];
}

export async function listPublicTradeInCostOptions(): Promise<TradeInCostOption[]> {
  const supabase = createPublicSupabaseClient({ noStore: true });
  const { data, error } = await supabase.rpc("get_trade_in_selectable_costs");
  if (error) return [];
  return (data ?? []).map((row: TradeInCostOption) => ({ ...row, amount: Number(row.amount) }));
}

"use server";

import { redirect } from "next/navigation";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

export async function submitPurchaseRequest(formData: FormData) {
  const productCode = String(formData.get("productCode") ?? "").trim();
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim();
  const addressLine = String(formData.get("addressLine") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const invoiceType = String(formData.get("invoiceType") ?? "individual");
  const invoiceName = String(formData.get("invoiceName") ?? "").trim();
  const invoiceCompany = String(formData.get("invoiceCompany") ?? "").trim();
  const taxOffice = String(formData.get("taxOffice") ?? "").trim();
  const taxNumber = String(formData.get("taxNumber") ?? "").trim();
  const customerNote = String(formData.get("customerNote") ?? "").trim();

  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase.rpc("submit_purchase_request", {
    p_product_code: productCode,
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_customer_email: customerEmail,
    p_address_line: addressLine,
    p_district: district,
    p_city: city,
    p_postal_code: postalCode,
    p_invoice_type: invoiceType,
    p_invoice_name: invoiceName,
    p_invoice_company: invoiceCompany,
    p_tax_office: taxOffice,
    p_tax_number: taxNumber,
    p_customer_note: customerNote,
  });

  if (error || !data) redirect(`/satinal/${encodeURIComponent(productCode)}?error=1`);
  redirect(`/satinal/${encodeURIComponent(productCode)}?success=${encodeURIComponent(String(data))}`);
}

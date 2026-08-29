"use client";

export function PrintLabelButton() {
  function printLabel() {
    const label = document.querySelector<HTMLElement>(".troveThermalLabel50x30");
    if (!label) return;

    const printWindow = window.open("", "trove-label-print", "width=760,height=520");
    if (!printWindow) {
      window.alert("Yazdırma penceresi açılamadı. Tarayıcı açılır pencere iznini kontrol et.");
      return;
    }

    const styles = Array.from(document.querySelectorAll<HTMLStyleElement | HTMLLinkElement>('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join("\n");

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
<html lang="tr"><head><meta charset="utf-8" /><title>Trove 50x30 Etiket</title>${styles}
<style>
@page{size:50mm 30mm;margin:0}
*{box-sizing:border-box!important}
html,body{width:50mm!important;height:30mm!important;margin:0!important;padding:0!important;overflow:hidden!important;background:#fff!important}
body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
.troveThermalLabel50x30{position:absolute!important;inset:0!important;width:50mm!important;height:30mm!important;margin:0!important;box-shadow:none!important;transform:none!important;zoom:1!important;overflow:hidden!important}
.code128Barcode{shape-rendering:crispEdges!important}
</style></head><body>${label.outerHTML}</body></html>`);
    printWindow.document.close();

    const runPrint = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };

    if (printWindow.document.readyState === "complete") window.setTimeout(runPrint, 250);
    else printWindow.addEventListener("load", () => window.setTimeout(runPrint, 250), { once: true });
  }

  return <button className="adminButton adminPrintOnlyHidden" type="button" onClick={printLabel}>Etiketi yazdır</button>;
}

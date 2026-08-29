"use client";

export function PrintLabelButton() {
  function printLabel() {
    const label = document.querySelector<HTMLElement>(".troveThermalLabel");
    if (!label) return;

    const printWindow = window.open("", "trove-label-print", "width=700,height=600");
    if (!printWindow) {
      window.alert("Yazdırma penceresi açılamadı. Tarayıcı açılır pencere iznini kontrol et.");
      return;
    }

    const styles = Array.from(document.querySelectorAll<HTMLStyleElement | HTMLLinkElement>('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join("\n");

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Trove 60x40 Etiket</title>
${styles}
<style>
@page { size: 60mm 40mm; margin: 0; }
* { box-sizing: border-box !important; }
html, body {
  width: 60mm !important;
  height: 40mm !important;
  min-width: 60mm !important;
  min-height: 40mm !important;
  max-width: 60mm !important;
  max-height: 40mm !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  background: #fff !important;
}
body {
  position: relative !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
.troveThermalLabel {
  position: absolute !important;
  inset: 0 !important;
  width: 60mm !important;
  height: 40mm !important;
  min-width: 60mm !important;
  min-height: 40mm !important;
  max-width: 60mm !important;
  max-height: 40mm !important;
  margin: 0 !important;
  transform: none !important;
  zoom: 1 !important;
  box-shadow: none !important;
  overflow: hidden !important;
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}
</style>
</head>
<body>${label.outerHTML}</body>
</html>`);
    printWindow.document.close();

    const runPrint = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };

    if (printWindow.document.readyState === "complete") {
      window.setTimeout(runPrint, 250);
    } else {
      printWindow.addEventListener("load", () => window.setTimeout(runPrint, 250), { once: true });
    }
  }

  return (
    <button className="adminButton adminPrintOnlyHidden" type="button" onClick={printLabel}>
      Etiketi yazdır
    </button>
  );
}

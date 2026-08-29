"use client";

export function PrintLabelButton() {
  function printLabel() {
    const label = document.querySelector<HTMLElement>(".troveThermalLabel");
    if (!label) return;

    const printWindow = window.open("", "trove-label-print", "width=500,height=650");
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
<title>Trove 30x40 Etiket</title>
${styles}
<style>
@page { size: 30mm 40mm; margin: 0; }
* { box-sizing: border-box !important; }
html, body {
  width: 30mm !important;
  height: 40mm !important;
  min-width: 30mm !important;
  min-height: 40mm !important;
  max-width: 30mm !important;
  max-height: 40mm !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  background: #fff !important;
}
body { position: relative !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
.troveThermalLabel {
  position: absolute !important;
  inset: 0 !important;
  width: 30mm !important;
  height: 40mm !important;
  min-width: 30mm !important;
  min-height: 40mm !important;
  max-width: 30mm !important;
  max-height: 40mm !important;
  margin: 0 !important;
  padding: 1.2mm 1.3mm 1mm !important;
  grid-template-rows: 5.4mm 1.2mm 7.2mm .5mm 13.2mm 7mm !important;
  transform: none !important;
  zoom: 1 !important;
  box-shadow: none !important;
  overflow: hidden !important;
}
.troveLabelTitle { font-size: 3.25mm !important; line-height: 5.4mm !important; letter-spacing: -.12mm !important; }
.troveLabelDivider { height: 1.2mm !important; }
.troveLabelSpecs { grid-template-columns: 1fr 1fr 1fr !important; }
.troveLabelSpec { gap: .25mm !important; padding: .4mm .15mm .25mm !important; }
.troveLabelSpec strong { font-size: 1.9mm !important; }
.troveLabelSpec > span, .troveLabelSpec div > span { font-size: 1mm !important; }
.troveBatteryIcon { width: 4.4mm !important; height: 3mm !important; padding: .3mm !important; gap: .15mm !important; border-width: .3mm !important; }
.troveBatteryIcon:after { right: -.7mm !important; top: .7mm !important; width: .55mm !important; height: 1.3mm !important; }
.troveColorDot { width: 3.2mm !important; height: 3.2mm !important; }
.troveBarcodeArea { padding: .6mm 1.8mm .2mm !important; }
.code128Barcode { width: 100% !important; height: 12.2mm !important; shape-rendering: crispEdges !important; }
.troveProductCode { font-size: 3.2mm !important; line-height: 4mm !important; letter-spacing: .18mm !important; }
.troveLabelBrand { width: 7mm !important; height: 2.5mm !important; }
.troveLabelBrand strong { font-size: 1.8mm !important; letter-spacing: .15mm !important; }
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

    if (printWindow.document.readyState === "complete") window.setTimeout(runPrint, 250);
    else printWindow.addEventListener("load", () => window.setTimeout(runPrint, 250), { once: true });
  }

  return <button className="adminButton adminPrintOnlyHidden" type="button" onClick={printLabel}>Etiketi yazdır</button>;
}

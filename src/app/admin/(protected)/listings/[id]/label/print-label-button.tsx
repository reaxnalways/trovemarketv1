"use client";

export function PrintLabelButton() {
  function printLabel() {
    const label = document.querySelector<HTMLElement>(".troveThermalLabel");
    if (!label) return;

    const printWindow = window.open("", "trove-label-print", "width=750,height=420");
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
<title>Trove 50x20 Etiket</title>
${styles}
<style>
@page { size: 50mm 20mm; margin: 0; }
* { box-sizing: border-box !important; }
html, body {
  width: 50mm !important;
  height: 20mm !important;
  min-width: 50mm !important;
  min-height: 20mm !important;
  max-width: 50mm !important;
  max-height: 20mm !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  background: #fff !important;
}
body { position: relative !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
.troveThermalLabel {
  position: absolute !important;
  inset: 0 !important;
  width: 50mm !important;
  height: 20mm !important;
  min-width: 50mm !important;
  min-height: 20mm !important;
  max-width: 50mm !important;
  max-height: 20mm !important;
  margin: 0 !important;
  padding: .7mm 1.5mm .55mm !important;
  grid-template-rows: 3.5mm .65mm 4mm .35mm 6.4mm 3.85mm !important;
  transform: none !important;
  zoom: 1 !important;
  box-shadow: none !important;
  overflow: hidden !important;
}
.troveLabelTitle { font-size: 3mm !important; line-height: 3.5mm !important; letter-spacing: -.08mm !important; }
.troveLabelDivider { height: .65mm !important; border-bottom-width: .3mm !important; }
.troveLabelDivider span { width: 1.2mm !important; height: 1.2mm !important; bottom: -.7mm !important; }
.troveLabelSpecs { grid-template-columns: 1fr 1fr 1fr !important; border-bottom-width: .3mm !important; }
.troveLabelSpec { gap: .35mm !important; padding: .3mm .25mm .2mm !important; }
.troveLabelSpec + .troveLabelSpec { border-left-width: .3mm !important; }
.troveLabelSpec strong { font-size: 2mm !important; line-height: .95 !important; }
.troveLabelSpec > span, .troveLabelSpec div > span { margin-top: .15mm !important; font-size: .85mm !important; }
.troveBatteryIcon { width: 4.6mm !important; height: 2.8mm !important; padding: .3mm !important; gap: .15mm !important; border-width: .3mm !important; }
.troveBatteryIcon:after { right: -.7mm !important; top: .65mm !important; width: .55mm !important; height: 1.25mm !important; }
.troveColorDot { width: 3mm !important; height: 3mm !important; border-width: .25mm !important; }
.troveBarcodeArea { padding: .35mm 3.5mm .1mm !important; }
.code128Barcode { width: 100% !important; height: 5.9mm !important; shape-rendering: crispEdges !important; }
.troveLabelBottom { min-height: 3.85mm !important; align-items: center !important; }
.troveProductCode { font-size: 2.7mm !important; line-height: 3.4mm !important; letter-spacing: .18mm !important; }
.troveLabelBrand { width: 9mm !important; height: 2.8mm !important; align-self: center !important; }
.troveLabelBrand strong { font-size: 1.9mm !important; letter-spacing: .2mm !important; }
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

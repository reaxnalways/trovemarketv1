"use client";

export function PrintLabelButton() {
  return (
    <button className="adminButton adminPrintOnlyHidden" type="button" onClick={() => window.print()}>
      Etiketi yazdır
    </button>
  );
}

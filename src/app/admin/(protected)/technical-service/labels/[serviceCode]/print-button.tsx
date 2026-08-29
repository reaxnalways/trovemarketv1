"use client";

export function PrintButton() {
  return <button className="adminButton" type="button" onClick={() => window.print()}>Etiketi yazdır</button>;
}

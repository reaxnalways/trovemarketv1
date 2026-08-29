type Code39BarcodeProps = {
  value: string;
  height?: number;
};

const CODE39: Record<string, string> = {
  "0": "101001101101",
  "1": "110100101011",
  "2": "101100101011",
  "3": "110110010101",
  "4": "101001101011",
  "5": "110100110101",
  "6": "101100110101",
  "7": "101001011011",
  "8": "110100101101",
  "9": "101100101101",
  "*": "100101101101",
};

export function Code39Barcode({ value, height = 64 }: Code39BarcodeProps) {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return null;

  const encoded = `*${normalized}*`
    .split("")
    .map((character) => CODE39[character])
    .join("0");

  const quietZone = 10;
  const moduleWidth = 2;
  const width = (encoded.length + quietZone * 2) * moduleWidth;

  return (
    <svg
      aria-label={`Barkod ${normalized}`}
      role="img"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width={width} height={height} fill="white" />
      {encoded.split("").map((bit, index) =>
        bit === "1" ? (
          <rect
            key={index}
            x={(index + quietZone) * moduleWidth}
            y={0}
            width={moduleWidth}
            height={height}
            fill="black"
          />
        ) : null,
      )}
    </svg>
  );
}

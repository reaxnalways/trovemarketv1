type Code39BarcodeProps = {
  value: string;
  height?: number;
  narrow?: number;
  wideRatio?: number;
  showText?: boolean;
};

const CODE39: Record<string, string> = {
  "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn", "4": "nnnwwnnnw",
  "5": "wnnwwnnnn", "6": "nnwwwnnnn", "7": "nnnwnnwnw", "8": "wnnwnnwnn", "9": "nnwwnnwnn",
  A: "wnnnnwnnw", B: "nnwnnwnnw", C: "wnwnnwnnn", D: "nnnnwwnnw", E: "wnnnwwnnn",
  F: "nnwnwwnnn", G: "nnnnnwwnw", H: "wnnnnwwnn", I: "nnwnnwwnn", J: "nnnnwwwnn",
  K: "wnnnnnnww", L: "nnwnnnnww", M: "wnwnnnnwn", N: "nnnnwnnww", O: "wnnnwnnwn",
  P: "nnwnwnnwn", Q: "nnnnnnwww", R: "wnnnnnwwn", S: "nnwnnnwwn", T: "nnnnwnwwn",
  U: "wwnnnnnnw", V: "nwwnnnnnw", W: "wwwnnnnnn", X: "nwnnwnnnw", Y: "wwnnwnnnn",
  Z: "nwwnwnnnn", "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", "$": "nwnwnwnnn",
  "/": "nwnwnnnwn", "+": "nwnnnwnwn", "%": "nnnwnwnwn", "*": "nwnnwnwnn",
};

export function Code39Barcode({ value, height = 72, narrow = 2, wideRatio = 2.5, showText = true }: Code39BarcodeProps) {
  const normalized = value.trim().toUpperCase();
  const invalid = [...normalized].find((char) => !CODE39[char]);
  if (!normalized || invalid) return <span>Geçersiz barkod değeri</span>;

  const encoded = `*${normalized}*`;
  const quiet = narrow * 10;
  const wide = narrow * wideRatio;
  const bars: Array<{ x: number; width: number }> = [];
  let x = quiet;

  for (let charIndex = 0; charIndex < encoded.length; charIndex += 1) {
    const pattern = CODE39[encoded[charIndex]];
    for (let elementIndex = 0; elementIndex < pattern.length; elementIndex += 1) {
      const width = pattern[elementIndex] === "w" ? wide : narrow;
      if (elementIndex % 2 === 0) bars.push({ x, width });
      x += width;
    }
    if (charIndex < encoded.length - 1) x += narrow;
  }

  const totalWidth = x + quiet;
  const textHeight = showText ? 22 : 0;

  return (
    <svg
      aria-label={`Barkod ${normalized}`}
      className="code39Barcode"
      role="img"
      viewBox={`0 0 ${totalWidth} ${height + textHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width={totalWidth} height={height + textHeight} fill="white" />
      {bars.map((bar, index) => <rect key={`${bar.x}-${index}`} x={bar.x} y={0} width={bar.width} height={height} fill="black" />)}
      {showText ? <text x={totalWidth / 2} y={height + 16} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" fill="black">{normalized}</text> : null}
    </svg>
  );
}

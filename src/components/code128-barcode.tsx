type Code128BarcodeProps = {
  value: string;
  height?: number;
  showText?: boolean;
};

const CODE128_PATTERNS = [
  "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
  "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
  "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
  "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
  "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
  "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
  "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
  "112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
  "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
  "214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
  "114131","311141","411131","211412","211214","211232","2331112",
] as const;

export function Code128Barcode({ value, height = 72, showText = false }: Code128BarcodeProps) {
  const normalized = value.trim();
  if (!/^\d{11}$/.test(normalized)) return <span className="barcodeError">Barkod 11 haneli sayısal ürün kodu olmalıdır.</span>;

  // 11 hane için ilk rakam Code B, kalan 10 rakam Code C ile çiftler halinde kodlanır.
  // Bu, tamamen Code B kullanımına göre etikette daha az modül ve daha güvenilir küçük baskı sağlar.
  const START_B = 104;
  const CODE_C = 99;
  const dataCodes = [normalized.charCodeAt(0) - 32, CODE_C];
  for (let index = 1; index < normalized.length; index += 2) dataCodes.push(Number(normalized.slice(index, index + 2)));

  const checksum = (START_B + dataCodes.reduce((sum, code, index) => sum + code * (index + 1), 0)) % 103;
  const sequence = [START_B, ...dataCodes, checksum, 106];
  const quietZone = 10;
  const modules: Array<{ x: number; width: number }> = [];
  let x = quietZone;

  for (const code of sequence) {
    const pattern = CODE128_PATTERNS[code];
    for (let index = 0; index < pattern.length; index += 1) {
      const width = Number(pattern[index]);
      if (index % 2 === 0) modules.push({ x, width });
      x += width;
    }
  }

  const totalWidth = x + quietZone;
  const textHeight = showText ? 16 : 0;
  return <svg aria-label={`Code 128 barkod ${normalized}`} className="code128Barcode" role="img" viewBox={`0 0 ${totalWidth} ${height + textHeight}`} preserveAspectRatio="none" shapeRendering="crispEdges"><rect width={totalWidth} height={height + textHeight} fill="white" />{modules.map((bar, index) => <rect key={`${bar.x}-${index}`} x={bar.x} y="0" width={bar.width} height={height} fill="black" />)}{showText ? <text x={totalWidth / 2} y={height + 13} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill="black">{normalized}</text> : null}</svg>;
}

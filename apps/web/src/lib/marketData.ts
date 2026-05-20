/**
 * Market pulse ticker data — illustrative values for the prototype.
 * W4 replaces this with a real feed via Cloudflare Workers + edge cache
 * (US Treasury for yields, FX from a paid vendor, equities from polygon.io).
 */

export interface Ticker {
  sym: string;
  px: string;
  chg: string;
  up: boolean;
  mono?: boolean;
}

export const tickers: Ticker[] = [
  { sym: "S&P 500", px: "5,287.41", chg: "+0.42%", up: true },
  { sym: "NASDAQ", px: "16,742.20", chg: "+0.61%", up: true },
  { sym: "DOW", px: "39,512.83", chg: "+0.18%", up: true },
  { sym: "US10Y", px: "4.318", chg: "-3.1 bp", up: false, mono: true },
  { sym: "US 2s10s", px: "+14 bp", chg: "+1.8 bp", up: true, mono: true },
  { sym: "DXY", px: "102.84", chg: "-0.21%", up: false },
  { sym: "USD/CNH", px: "7.2104", chg: "-0.08%", up: false },
  { sym: "USD/JPY", px: "152.66", chg: "+0.34%", up: true },
  { sym: "HSI", px: "19,418.5", chg: "+1.12%", up: true },
  { sym: "CSI 300", px: "3,884.27", chg: "+0.74%", up: true },
  { sym: "NIKKEI", px: "38,202.1", chg: "-0.31%", up: false },
  { sym: "BRENT", px: "82.40", chg: "-0.55%", up: false },
  { sym: "GOLD", px: "2,418.6", chg: "+0.92%", up: true },
  { sym: "BTC", px: "67,840", chg: "+1.84%", up: true },
  { sym: "VIX", px: "13.42", chg: "-2.8%", up: false },
  { sym: "HK10Y", px: "3.842", chg: "-1.4 bp", up: false, mono: true },
  { sym: "CN10Y", px: "2.178", chg: "-0.8 bp", up: false, mono: true },
];

/** Synthetic 2s10s line series (Jan 2024 → May 2026, monthly) used by article chart placeholder. */
export const curve2s10s = [
  -34, -39, -42, -38, -35, -41, -45, -48, -52, -47, -41, -33,
  -27, -22, -18, -15, -11, -7, -2, 1, 4, 6, 9, 12, 14,
];
export const curveLabels = ["Jan'24", "Jul'24", "Jan'25", "Jul'25", "Jan'26", "May'26"];

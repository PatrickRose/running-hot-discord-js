export type Corporation = "DTC" | "GenEq" | "Gordon" | "MCM" | "ANT";

export const CORPORATION_NAMES: Record<Corporation, string> = {
  ANT: "Augmented Nucleotech",
  DTC: "Digital Tactical Control",
  GenEq: "Genetic Equity",
  Gordon: "Gordon",
  MCM: "McCullough Calibrated Mechanical",
};

export const CORPORATION_LOGOS: Record<Corporation, string> = {
  ANT: "https://imgur.com/G6fiwSc.png",
  DTC: "https://imgur.com/CB60asF.png",
  GenEq: "https://imgur.com/RgjUMX5.png",
  Gordon: "https://imgur.com/G9uy4Kr.png",
  MCM: "https://imgur.com/a51LWNo.png",
};

export const CORPORATION_THUMBNAILS: Record<Corporation, string> = {
  ANT: "https://imgur.com/jz4ACxp.png",
  DTC: "https://imgur.com/URD2QhC.png",
  GenEq: "https://imgur.com/saEhBAx.png",
  Gordon: "https://imgur.com/jGZByRY.png",
  MCM: "https://imgur.com/r93Im5C.png",
};

export const ALL_CORPORATIONS: Corporation[] = Object.keys(
  CORPORATION_NAMES,
) as Corporation[];

export function isCorporation(input: unknown): input is Corporation {
  if (typeof input != "string") {
    return false;
  }

  return ALL_CORPORATIONS.includes(input as Corporation);
}

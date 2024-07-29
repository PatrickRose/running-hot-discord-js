export type Corporation = 'DTC' | 'GenEq' | 'Gordon' | 'MCM' | 'ANT';

export const CORPORATION_NAMES: Record<Corporation, string> = {
    ANT: "Augmented Nucleotech",
    DTC: "Digital Tactical Control",
    GenEq: "Genetic Equity",
    Gordon: "Gordon",
    MCM: "McCullough Calibrated Mechanical"
}

export const ALL_CORPORATIONS: Corporation[] = Object.keys(CORPORATION_NAMES) as Corporation[];

export function isCorporation(input: unknown): input is Corporation {
    if (typeof input != 'string') {
        return false;
    }

    return ALL_CORPORATIONS.includes(input as Corporation);
}

export interface DecomposeLayout {
    startX: number;
    spacing: number;
}

export function getDecomposeLayout(a: number, b: number, spacing = 18): DecomposeLayout {
    const total = a + b;
    const startX = 100 - ((total - 1) * spacing) / 2;
    return { startX, spacing };
}

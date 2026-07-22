import { setSeed, random } from '../../../../lib/random.ts';

export interface Position {
    x: number;
    y: number;
}

export interface LayoutResult {
    positions: Position[];
    itemSize: number;
}

export function generateScatteredPositions(
    numItems: number,
    problemId: string,
    width = 450,
    height = 200,
    maxItemSize = 40
): LayoutResult {
    const positions: Position[] = [];

    // Optimize grid dimensions
    const ratio = width / height;
    const cols = Math.max(1, Math.ceil(Math.sqrt(numItems * ratio)));
    const rows = Math.ceil(numItems / cols);

    const padding = 10;
    const availableW = width - padding * 2;
    const availableH = height - padding * 2;
    const cellW = availableW / cols;
    const cellH = availableH / rows;

    // Scale down size if cells are smaller than maxItemSize
    const itemSize = Math.min(maxItemSize, cellW - 2, cellH - 2);
    const halfSize = itemSize / 2;

    for (let i = 0; i < numItems; i++) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const baseX = padding + c * cellW + cellW / 2 - halfSize;
        const baseY = padding + r * cellH + cellH / 2 - halfSize;
        positions.push({
            x: Math.round(baseX),
            y: Math.round(baseY)
        });
    }
    return { positions, itemSize };
}

import { setSeed, random } from '../../../../lib/random.ts';

export interface Position {
    x: number;
    y: number;
}

export function generateScatteredPositions(
    numItems: number,
    problemId: string,
    width = 450,
    height = 160
): Position[] {
    setSeed(problemId);
    const positions: Position[] = [];

    const effectiveMinDist = numItems > 15 ? 34 : (numItems > 10 ? 38 : 42);
    const maxTopLeftX = width - 55;
    const maxTopLeftY = height - 60;

    for (let i = 0; i < numItems; i++) {
        let attempts = 0;
        let found = false;
        let x = 0, y = 0;
        while (attempts < 400 && !found) {
            attempts++;
            x = Math.floor(random() * (maxTopLeftX - 15)) + 15;
            y = Math.floor(random() * (maxTopLeftY - 10)) + 10;
            const tooClose = positions.some(p => {
                const dx = p.x - x;
                const dy = p.y - y;
                return Math.sqrt(dx * dx + dy * dy) < effectiveMinDist;
            });
            if (!tooClose) {
                positions.push({ x, y });
                found = true;
            }
        }
        if (!found) {
            let bestX = 15;
            let bestY = 10;
            let bestDist = -1;
            const cols = 8;
            const rows = 3;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const gx = 15 + c * Math.floor((maxTopLeftX - 15) / (cols - 1));
                    const gy = 10 + r * Math.floor((maxTopLeftY - 10) / (rows - 1));
                    const minDist = positions.reduce((min, p) => {
                        const dist = Math.sqrt((p.x - gx) ** 2 + (p.y - gy) ** 2);
                        return Math.min(min, dist);
                    }, 9999);
                    if (minDist > bestDist) {
                        bestDist = minDist;
                        bestX = gx;
                        bestY = gy;
                    }
                }
            }
            positions.push({ x: bestX, y: bestY });
        }
    }
    return positions;
}

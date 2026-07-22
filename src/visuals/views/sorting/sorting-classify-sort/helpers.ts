import {random, setSeed} from '../../../../lib/random.ts';

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

    const effectiveMinDist = numItems > 15 ? 36 : (numItems > 10 ? 38 : 42);
    const maxTopLeftX = width - 55;
    const maxTopLeftY = height - 55;

    for (let i = 0; i < numItems; i++) {
        let attempts = 0;
        let found = false;
        let x = 0, y = 0;
        while (attempts < 300 && !found) {
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
            const cols = 7;
            const c = i % cols;
            const r = Math.floor(i / cols);
            positions.push({
                x: 15 + c * 58,
                y: 10 + r * 38
            });
        }
    }
    return positions;
}

export function getRelationAnswer(
    categories: Record<string, number>,
    relation: 'most' | 'least',
    possible: string[]
): string {
    let targetCategory = '';
    let targetCount = relation === 'most' ? -1 : 999;
    possible.forEach(cat => {
        const c = categories[cat] || 0;
        if (relation === 'most') {
            if (c > targetCount) {
                targetCount = c;
                targetCategory = cat;
            }
        } else {
            if (c < targetCount) {
                targetCount = c;
                targetCategory = cat;
            }
        }
    });
    return targetCategory;
}

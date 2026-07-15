import { setSeed, random } from '../../../lib/random.ts';

export interface Position {
    x: number;
    y: number;
}

export function generateScatteredPositions(
    numItems: number,
    problemId: string,
    width = 450,
    height = 160,
    minDistance = 45
): Position[] {
    setSeed(problemId);
    const positions: Position[] = [];

    for (let i = 0; i < numItems; i++) {
        let attempts = 0;
        let found = false;
        let x = 0, y = 0;
        while (attempts < 300 && !found) {
            attempts++;
            x = Math.floor(random() * (width - 70)) + 15;
            y = Math.floor(random() * (height - 70)) + 15;
            const tooClose = positions.some(p => {
                const dx = p.x - x;
                const dy = p.y - y;
                return Math.sqrt(dx * dx + dy * dy) < minDistance;
            });
            if (!tooClose) {
                positions.push({ x, y });
                found = true;
            }
        }
        if (!found) {
            positions.push({
                x: 15 + (i % 6) * 65,
                y: 15 + Math.floor(i / 6) * 45
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

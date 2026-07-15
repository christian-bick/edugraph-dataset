import { setSeed, random } from '../../lib/random.ts';

export interface Position {
    x: number;
    y: number;
}

export function generatePositions(
    numObjects: number,
    arrangement: string,
    problemId: string
): Position[] {
    setSeed(problemId);
    const positions: Position[] = [];
    const width = 450;
    const height = 300;

    const actualArrangement = arrangement || 'line';

    if (actualArrangement === 'circle') {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;
        for (let i = 0; i < numObjects; i++) {
            const theta = i * (2 * Math.PI / numObjects) - Math.PI / 2;
            positions.push({
                x: centerX + radius * Math.cos(theta) - 20,
                y: centerY + radius * Math.sin(theta) - 20
            });
        }
    } else if (actualArrangement === 'array') {
        const cols = Math.ceil(Math.sqrt(numObjects));
        const rows = Math.ceil(numObjects / cols);
        const colSpacing = Math.min(60, (width - 60) / cols);
        const rowSpacing = Math.min(60, (height - 60) / rows);
        const startX = width / 2 - ((cols - 1) * colSpacing) / 2;
        const startY = height / 2 - ((rows - 1) * rowSpacing) / 2;
        for (let i = 0; i < numObjects; i++) {
            const r = Math.floor(i / cols);
            const c = i % cols;
            positions.push({
                x: startX + c * colSpacing - 20,
                y: startY + r * rowSpacing - 20
            });
        }
    } else if (actualArrangement === 'scattered') {
        const minDistance = numObjects > 15 ? 42 : (numObjects > 10 ? 46 : 55);
        for (let i = 0; i < numObjects; i++) {
            let attempts = 0;
            let found = false;
            let x = 0, y = 0;
            while (attempts < 300 && !found) {
                attempts++;
                x = Math.floor(random() * (width - 100)) + 50;
                y = Math.floor(random() * (height - 100)) + 50;
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
                    x: 50 + (i % 5) * 80,
                    y: 50 + Math.floor(i / 5) * 80
                });
            }
        }
    } else {
        // line
        const spacing = Math.min(55, (width - 60) / numObjects);
        const startX = width / 2 - ((numObjects - 1) * spacing) / 2;
        const y = height / 2 - 20;
        for (let i = 0; i < numObjects; i++) {
            positions.push({
                x: startX + i * spacing,
                y
            });
        }
    }

    return positions;
}

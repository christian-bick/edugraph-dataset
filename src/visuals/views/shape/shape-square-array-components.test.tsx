import {createHash} from 'node:crypto';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {SquareGridDiagram} from './shape-square-array-components.tsx';

const grids = [{rows: 1, columns: 1}, ...[2, 3, 4, 5].flatMap(rows =>
    [2, 3, 4, 5].map(columns => ({rows, columns})))];
const diagram = (rows: number, columns: number, showCount: boolean, showCountingPath = true) =>
    renderToStaticMarkup(<SquareGridDiagram geometry={{rows, columns, cellCount: rows * columns}}
        showCells showCount={showCount} showCountingPath={showCountingPath} showSideLengths />);

const attribute = (attributes: string, name: string) => {
    const value = attributes.match(new RegExp(`(?:^| )${name}="([^"]*)"`))?.[1];
    if (value === undefined) throw new Error(`Missing SVG ${name}`);
    return value;
};
const cells = (markup: string) => [...markup.matchAll(/<g>(.*?)<\/g>/g)].map(([, content]) => {
    const rectangle = content.match(/<rect ([^>]*)>/)?.[1];
    if (!rectangle) throw new Error('Missing tile rectangle');
    const texts = [...content.matchAll(/<text ([^>]*)>([^<]*)<\/text>/g)].map(([, attributes, text]) => ({
        text,
        x: Number(attribute(attributes, 'x')),
        y: Number(attribute(attributes, 'y')),
        fontSize: Number(attribute(attributes, 'class').match(/text-\[(\d+)px\]/)?.[1])
    }));
    return {x: Number(attribute(rectangle, 'x')), y: Number(attribute(rectangle, 'y')),
        width: Number(attribute(rectangle, 'width')), height: Number(attribute(rectangle, 'height')),
        texts, ordinal: texts.find(({text}) => /^\d+$/.test(text)),
        arrow: texts.find(({text}) => /^[→↓←]$/.test(text))};
});

describe('square-grid counting path', () => {
    it.each(grids)('counts each tile once along the same Question/Solution path for $rows × $columns', ({rows, columns}) => {
        const question = cells(diagram(rows, columns, false));
        const solution = cells(diagram(rows, columns, true));
        const count = rows * columns;
        expect(question).toHaveLength(count);
        expect(solution).toHaveLength(count);
        expect(question.every(cell => !cell.ordinal)).toBe(true);
        expect(question.filter(cell => cell.texts.some(({text}) => text === 'start'))).toHaveLength(1);
        expect(solution.flatMap(cell => cell.texts).some(({text}) => text === 'start')).toBe(false);
        expect(solution.map(cell => Number(cell.ordinal?.text)).sort((a, b) => a - b))
            .toEqual(Array.from({length: count}, (_, index) => index + 1));
        expect(solution.map(cell => ({x: cell.x, y: cell.y, arrow: cell.arrow?.text})))
            .toEqual(question.map(cell => ({x: cell.x, y: cell.y, arrow: cell.arrow?.text})));
        expect(solution.filter(cell => cell.arrow)).toHaveLength(count - 1);

        // Follow the arrows geometrically, rather than rebuilding the snake-index formula.
        let current = solution.find(cell => cell.x === Math.min(...solution.map(tile => tile.x))
            && cell.y === Math.min(...solution.map(tile => tile.y)))!;
        const visited = new Set<string>();
        for (let ordinal = 1; ordinal <= count; ordinal++) {
            const key = `${current.x},${current.y}`;
            expect(visited.has(key)).toBe(false);
            visited.add(key);
            expect(current.ordinal?.text).toBe(String(ordinal));
            if (ordinal === count) {
                expect(current.arrow).toBeUndefined();
                continue;
            }
            expect(current.arrow).toBeDefined();
            const nextX = current.x + (current.arrow?.text === '→' ? current.width
                : current.arrow?.text === '←' ? -current.width : 0);
            const nextY = current.y + (current.arrow?.text === '↓' ? current.height : 0);
            const next = solution.find(cell => cell.x === nextX && cell.y === nextY);
            expect(next, 'Every arrow must reach an adjacent tile').toBeDefined();
            current = next!;
        }
        expect(visited.size).toBe(count);
    });

    it.each(grids)('separates ordinal and arrow glyph bands inside every $rows × $columns tile', ({rows, columns}) => {
        for (const cell of cells(diagram(rows, columns, true))) {
            const number = cell.ordinal!;
            expect(number).toBeDefined();
            expect(number.x).toBe(cell.x + cell.width / 2);
            expect(number.y - number.fontSize).toBeGreaterThanOrEqual(cell.y);
            // A conservative full-em width per digit also covers the two-digit ordinals.
            expect(number.text.length * number.fontSize).toBeLessThan(cell.width);
            if (!cell.arrow) continue;
            expect(cell.arrow.x).toBe(number.x);
            expect(cell.arrow.y - cell.arrow.fontSize).toBeGreaterThan(number.y);
            expect(cell.arrow.y).toBeLessThanOrEqual(cell.y + cell.height);
        }
    });

    it.each(grids)('keeps non-traversal numbering and neutral cells for $rows × $columns', ({rows, columns}) => {
        const question = diagram(rows, columns, false, false);
        const solution = diagram(rows, columns, true, false);
        expect(question).not.toMatch(/start|[→↓←]/);
        expect(solution).not.toMatch(/start|[→↓←]/);
        expect(cells(question).every(cell => !cell.ordinal)).toBe(true);
        expect(cells(solution).map(cell => Number(cell.ordinal?.text)))
            .toEqual(Array.from({length: rows * columns}, (_, index) => index + 1));
    });

    // Captured before the counting-path repair; endpoints cover single and multi-digit grids.
    it.each([
        [1, 1, false, '47b9d871e4e0c86334071066f2754c6c43e6577bac0481960ff480aa632644ab'],
        [1, 1, true, '0461a0d2a3092d84b4f25e50e0fe183900bd24b19160a0850938fc7008161588'],
        [5, 5, false, '80edf9dcd3321500d49c6ce9592eebf5cf13ed8eae5dcf3b80cca8855014acbb'],
        [5, 5, true, '31b605eb2277d558b7d245a6f5aeaf83870af25da9f7fc37a37f832a89ee8fd8']
    ] as const)('keeps non-path markup unchanged for %i × %i, counts %s', (rows, columns, showCount, hash) => {
        expect(createHash('sha256').update(diagram(rows, columns, showCount, false)).digest('hex')).toBe(hash);
    });
});

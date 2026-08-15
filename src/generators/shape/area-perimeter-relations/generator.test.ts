import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {AreaPerimeterRelationsGenerator} from './generator.ts';

const generator = new AreaPerimeterRelationsGenerator();

describe('AreaPerimeterRelationsGenerator', () => {
    it('generates rectangles with equal perimeters and different areas', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({}).data;

            expect(data.task).toBe('same-perimeter');
            expect(data.equalMeasure).toBe('perimeter');
            expect(data.first.perimeter).toBe(data.second.perimeter);
            expect(data.first.area).not.toBe(data.second.area);
            expect(data.first.area).toBe(data.first.width * data.first.height);
            expect(data.second.area).toBe(data.second.width * data.second.height);
            expect(data.first.perimeter).toBe(2 * (data.first.width + data.first.height));
            expect(data.second.perimeter).toBe(2 * (data.second.width + data.second.height));
        }
    });

    it('is deterministic for a fixed seed', () => {
        setSeed(17);
        const first = generator.generate({});
        setSeed(17);
        expect(generator.generate({})).toEqual(first);
    });
});

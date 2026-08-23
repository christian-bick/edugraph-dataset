import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {AreaPerimeterRelationsGenerator} from './generator.ts';

const generator = new AreaPerimeterRelationsGenerator();

describe('AreaPerimeterRelationsGenerator', () => {
    it('generates both rectangle relation modes with correct measures', () => {
        const tasks = new Set<string>();

        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({}).data;

            tasks.add(data.relation);
            expect(data.first.area).toBe(data.first.width * data.first.height);
            expect(data.second.area).toBe(data.second.width * data.second.height);
            expect(data.first.perimeter).toBe(2 * (data.first.width + data.first.height));
            expect(data.second.perimeter).toBe(2 * (data.second.width + data.second.height));

            if (data.relation === 'equal-perimeter') {
                expect(data.first.perimeter).toBe(data.second.perimeter);
                expect(data.first.area).not.toBe(data.second.area);
            } else {
                expect(data.first.area).toBe(data.second.area);
                expect(data.first.perimeter).not.toBe(data.second.perimeter);
            }

            expect(data).not.toHaveProperty('task');
            expect(data).not.toHaveProperty('equalMeasure');
            expect(data).not.toHaveProperty('unit');
            expect(data).not.toHaveProperty('areaUnit');
        }

        expect(tasks).toEqual(new Set(['equal-perimeter', 'equal-area']));
    });

    it('is deterministic for a fixed seed', () => {
        setSeed(17);
        const first = generator.generate({});
        setSeed(17);
        expect(generator.generate({})).toEqual(first);
    });
});

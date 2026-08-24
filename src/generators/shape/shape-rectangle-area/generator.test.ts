import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {ShapeRectangleAreaGenerator} from './generator.ts';

const generator = new ShapeRectangleAreaGenerator();

describe('ShapeRectangleAreaGenerator', () => {
    it('requires the resolved equation capability flag', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        expect(() => generator.generate({equation: 'yes'} as never)).toThrow('must be boolean');
    });

    it('authors one typed rectangle-area relation', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generator.generate({equation: seed % 2 === 0}).data;
            expect(data.kind).toBe('rectangle-area');
            expect(data.area).toBe(data.length * data.width);
            expect(data.unitId).toBe('square-unit');
            expect(data).not.toHaveProperty('formula');
            expect(data).not.toHaveProperty('rows');
            expect(data).not.toHaveProperty('columns');
            expect(data).not.toHaveProperty('squareCount');
        }
    });

    it('does not vary the relation by equation capability', () => {
        setSeed(19);
        const plain = generator.generate({equation: false});
        setSeed(19);
        const equation = generator.generate({equation: true});
        expect(equation).toEqual(plain);
    });
});

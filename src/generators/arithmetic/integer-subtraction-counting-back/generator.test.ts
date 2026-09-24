import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {IntegerSubtractionCountingBackGenerator} from './generator.ts';

describe('IntegerSubtractionCountingBackGenerator', () => {
    const generator = new IntegerSubtractionCountingBackGenerator();

    it('generates complete, consistent integer-subtraction-counting-back evidence', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({range: {min: 0, max: 20}})!.data;
            expect(data.strategy).toBe('subtraction-counting-back');
            expect(data.operation).toBe('subtraction');
            expect(data.answer).toBe(data.leftOperand - data.rightOperand);
            expect(data.steps).toEqual(Array.from({length: data.rightOperand}, (_, index) => ({
                kind: 'operation', operation: 'subtraction',
                leftOperand: data.leftOperand - index, rightOperand: 1,
                result: data.leftOperand - (index + 1)
            })));
        }
    });

    it('is deterministic for a seed and configuration', () => {
        setSeed('integer-subtraction-counting-back');
        const first = generator.generate({range: {min: 0, max: 20}});
        setSeed('integer-subtraction-counting-back');
        expect(generator.generate({range: {min: 0, max: 20}})).toEqual(first);
    });

    it('validates configuration before generating evidence', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({})).toThrow();
        expect(generator.generate({range: {min: 5, max: 4}})).toBeNull();
        expect(generator.generate({range: {min: 0, max: NaN}})).toBeNull();
        expect(generator.generate({range: {min: 9, max: 10}})).toBeNull();
    });

});

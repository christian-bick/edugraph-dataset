import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {ShapePatternProblem} from '../../../types/problems.ts';
import {ShapePatternsGenerator} from './generator.ts';
import {ShapePatternsGeneratorConfig} from './spec.ts';

const generator = new ShapePatternsGenerator();

const configs = [
    {generatesPattern: true, recognizesEmergentFeature: false},
    {generatesPattern: false, recognizesEmergentFeature: true},
    {generatesPattern: true, recognizesEmergentFeature: true}
] satisfies ShapePatternsGeneratorConfig[];

function findPattern(patternKind: ShapePatternProblem['patternKind']): ShapePatternProblem {
    for (let seed = 0; seed < 50; seed++) {
        setSeed(seed);
        const data = generator.generate(configs[0])!.data;
        if (data.patternKind === patternKind) return data;
    }
    throw new Error(`Could not generate ${patternKind}.`);
}

describe('ShapePatternsGenerator', () => {
    it('strictly validates every Area selector field', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        expect(() => generator.generate({generatesPattern: true})).toThrow(GeneratorValidationError);
    });

    it('emits the same neutral pattern contract for every supported Area combination', () => {
        const outputs = configs.map(config => {
            setSeed(14);
            return generator.generate(config)!.data;
        });
        expect(outputs[1]).toEqual(outputs[0]);
        expect(outputs[2]).toEqual(outputs[0]);
        expect(Object.keys(outputs[0]).sort()).toEqual([
            'emergentFeature',
            'patternKind',
            'recurrence',
            'sequence'
        ]);
    });

    it('builds a typed growth recurrence whose count parity matches each position', () => {
        const growth = findPattern('growth-parity');
        expect(growth.patternKind).toBe('growth-parity');
        if (growth.patternKind !== 'growth-parity') throw new Error('Expected growth pattern.');
        expect(growth.recurrence).toEqual({
            kind: 'add-square',
            initialSquareCount: 1,
            squareCountIncrease: 1
        });
        expect(growth.emergentFeature).toEqual({kind: 'position-count-parity'});
        growth.sequence.forEach(term => {
            expect(term.tokens).toHaveLength(term.position);
            expect(term.tokens.every(token => token.shape === 'square' && token.orientation === 0)).toBe(true);
            expect(term.tokens.length % 2).toBe(term.position % 2);
        });
    });

    it('builds a typed quarter-turn recurrence whose orientation axis alternates', () => {
        const rotation = findPattern('rotation-axis');
        expect(rotation.patternKind).toBe('rotation-axis');
        if (rotation.patternKind !== 'rotation-axis') throw new Error('Expected rotation pattern.');
        expect(rotation.recurrence).toEqual({
            kind: 'quarter-turn-clockwise',
            initialOrientation: 0,
            quarterTurnsPerTerm: 1
        });
        expect(rotation.emergentFeature).toEqual({kind: 'position-axis-parity'});
        expect(rotation.sequence.map(term => term.tokens[0])).toEqual([
            {shape: 'triangle', orientation: 0},
            {shape: 'triangle', orientation: 90},
            {shape: 'triangle', orientation: 180},
            {shape: 'triangle', orientation: 270},
            {shape: 'triangle', orientation: 0},
            {shape: 'triangle', orientation: 90}
        ]);
    });

    it('rejects absent and invalid Area selector combinations', () => {
        expect(generator.generate({
            generatesPattern: false,
            recognizesEmergentFeature: false
        })).toBeNull();
        expect(generator.generate({
            recognizesEmergentFeature: false,
            generatesPattern: 'true' as unknown as boolean
        })).toBeNull();
    });

    it('is deterministic for a fixed seed', () => {
        setSeed(28);
        const first = generator.generate(configs[1]);
        setSeed(28);
        expect(generator.generate(configs[1])).toEqual(first);
    });
});

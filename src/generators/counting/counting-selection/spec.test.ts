import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractSchemaLabels, generateWithLabels} from '../../../lib/utils.ts';
import {CountingBasicGeneratorSchema, spec as basicSpec} from '../counting-basic/spec.ts';
import {CountingSelectionGenerator} from './generator.ts';
import {CountingSelectionGeneratorSchema, spec} from './spec.ts';

describe('counting-selection spec', () => {
    const generator = new CountingSelectionGenerator();

    it('preserves the basic counting capabilities without selecting a learner action', () => {
        expect(spec.generalLabels).toEqual(basicSpec.generalLabels);
        expect(extractSchemaLabels(CountingSelectionGeneratorSchema))
            .toEqual(extractSchemaLabels(CountingBasicGeneratorSchema));
        expect(Object.keys(CountingSelectionGeneratorSchema).sort()).toEqual(['parity', 'range']);
    });

    it.each([
        [[Scope.NumbersSmaller10], 1, 10],
        [[Scope.NumbersLarger5, Scope.NumbersSmaller20], 5, 20],
        [[Scope.NumbersLarger10, Scope.NumbersSmaller20], 10, 20]
    ] as const)('bounds requested and available counts using the same resolved range: %j', (labels, min, max) => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [...labels])!;
            expect(stub.labels).toEqual(expect.arrayContaining([...labels]));
            expect(stub.data.numObjects).toBeGreaterThanOrEqual(min);
            expect(stub.data.availableCount).toBeGreaterThanOrEqual(stub.data.numObjects);
            expect(stub.data.availableCount).toBeLessThanOrEqual(max);
            expect(stub.data.simpleAnswer).toBe(stub.data.numObjects);
            expect(stub.data).not.toHaveProperty('parity');
            expect(stub.labels).not.toContain(Area.EvenDivisibility);
            expect(stub.labels).not.toContain(Area.UnevenDivisibility);
        }
    });

    it.each([
        [Area.EvenDivisibility, Scope.EvenNumbers, 'even'],
        [Area.UnevenDivisibility, Scope.OddNumbers, 'odd']
    ] as const)('preserves the requested subset property %s and %s', (area, scope, parity) => {
        const stub = generateWithLabels(generator, [area, scope, Scope.NumbersSmaller20])!;
        expect(stub.labels).toEqual(expect.arrayContaining([area, scope]));
        expect(stub.data.parity).toBe(parity);
        expect(stub.data.numObjects % 2).toBe(parity === 'even' ? 0 : 1);
        expect(stub.data.availableCount).toBeGreaterThanOrEqual(stub.data.numObjects);
    });

    it('rejects contradictory subset parity labels', () => {
        expect(() => generateWithLabels(generator, [Area.EvenDivisibility, Scope.OddNumbers, Scope.NumbersSmaller20]))
            .toThrow('Parity labels');
    });
});

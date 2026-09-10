import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {ShapeFractionRegionGenerator} from './generator.ts';
import {ShapeFractionRegionGeneratorSchema} from './spec.ts';

const generator = new ShapeFractionRegionGenerator();
const denominators = [[Scope.HalfFractions, 2], [Scope.ThirdFractions, 3], [Scope.QuarterFractions, 4],
    [Scope.SixthFractions, 6], [Scope.EighthFractions, 8]] as const;
describe('ShapeFractionRegionGenerator schema', () => {
    it('resolves each feasible denominator and fraction-kind conjunction without extra claims', () => {
        for (const [label, parts] of denominators) {
            for (const kind of [Scope.UnitFractions, Scope.NonUnitFractions]) {
                if (parts === 2 && kind === Scope.NonUnitFractions) continue;
                const result = generateWithLabels(generator, [Area.Circle, label, kind])!;
                expect(result.data.parts).toBe(parts);
                expect(result.data.numerator === 1).toBe(kind === Scope.UnitFractions);
                expect(result.labels.sort()).toEqual([Area.Circle, label, kind].sort());
            }
        }
    });
    it('completes partial requests with a feasible correlated denominator and records both choices', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const result = generateWithLabels(generator, [Area.Rectangle, Scope.NonUnitFractions])!;
            expect(result.data.parts).toBeGreaterThan(2);
            expect(result.data.numerator).toBeGreaterThan(1);
            expect(result.data.numerator).toBeLessThan(result.data.parts);
            expect(result.labels).toContain(denominators.find(([, parts]) => parts === result.data.parts)![0]);
        }
        const halves = generateWithLabels(generator, [Area.Circle, Scope.HalfFractions])!;
        expect(halves.data.numerator).toBe(1);
        expect(halves.labels).toContain(Scope.UnitFractions);
    });
    it('rejects impossible proper nonunit halves and competing denominator choices', () => {
        expect(() => extractConfig(ShapeFractionRegionGeneratorSchema, [Scope.HalfFractions, Scope.NonUnitFractions])).toThrow();
        expect(() => extractConfig(ShapeFractionRegionGeneratorSchema, [Scope.SixthFractions, Scope.EighthFractions])).toThrow();
    });
});

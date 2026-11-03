import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementUnitCountRelationsGenerator} from './generator.ts';
import {MeasurementUnitCountRelationsGeneratorSchema as schema, spec} from './spec.ts';

const cells = [
    [[Scope.NumbersSmaller10], 0, 10], [[Scope.NumbersSmaller20], 0, 20],
    [[Scope.NumbersSmaller10, Scope.NumbersLarger5], 5, 10],
    [[Scope.NumbersSmaller20, Scope.NumbersLarger5], 5, 20]
] as const;

describe('unit count relation capabilities', () => {
    it('retains invariant unit mathematics and delegates Abilities to consumers', () => {
        expect(spec.generalLabels).toEqual([Area.UnitScaleRelation, Scope.SegmentScale, Scope.IntegerNumbers,
            Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]);
        for (const ability of Object.values(Ability)) expect(spec.generalLabels).not.toContain(ability);
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
    });

    it.each(cells)('resolves the exact tuple %j through direct and planned paths', (labels, lower, upper) => {
        setSeed(31); const direct = extractConfig(schema, [...labels]), state = getRandomState();
        expect(direct.config).toEqual({range: createCanonicalNumericRange(upper, lower)});
        expect(new Set(direct.resolvedLabels)).toEqual(new Set(labels));
        setSeed(31); const planned = resolveSchemaChoices(schema, [...labels], {range: [...labels]});
        expect(planned.config).toEqual(direct.config);
        expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
        expect(getRandomState()).toBe(state);
        const generated = generateWithLabels(new MeasurementUnitCountRelationsGenerator(), [...labels])!;
        expect(new Set(generated.labels)).toEqual(new Set(labels));
        expect(generated.data).not.toHaveProperty('unitsPerLarge');
        expect(generated.data.largeUnitCount).toBeGreaterThanOrEqual(lower);
        expect(generated.data.largeUnitCount).toBeLessThan(lower === 0 ? 5 : 10);
        expect(generated.data.smallUnitCount).toBeLessThanOrEqual(upper);
        expect(generated.data.smallUnitCount).toBeGreaterThan(upper === 10 ? 5 : 10);
    });

    it.each([[], [Scope.NumbersSmaller10], [Scope.NumbersSmaller20], [Scope.NumbersLarger5]].map(labels => [labels] as const))(
        'keeps every partial direct request %j feasible', labels => {
            for (let seed = 0; seed < 24; seed++) {
                setSeed(seed); const result = generateWithLabels(new MeasurementUnitCountRelationsGenerator(), labels)!;
                const upper = result.labels.includes(Scope.NumbersSmaller20) ? 20 : 10;
                const lower = result.labels.includes(Scope.NumbersLarger5) ? 5 : 0;
                expect(result.data.largeUnitCount).toBeGreaterThanOrEqual(lower);
                expect(result.data.largeUnitCount).toBeLessThan(lower === 0 ? 5 : 10);
                expect(result.data.smallUnitCount).toBeLessThanOrEqual(upper);
                expect(result.data.smallUnitCount).toBeGreaterThan(upper === 10 ? 5 : 10);
            }
        });

    it('rejects contradictory upper choices', () => {
        expect(() => extractConfig(schema, [Scope.NumbersSmaller10, Scope.NumbersSmaller20])).toThrow();
    });
});

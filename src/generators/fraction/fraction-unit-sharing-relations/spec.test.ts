import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {FractionUnitSharingRelationsGeneratorSchema as schema, spec} from './spec.ts';

describe('fraction-unit-sharing-relations schema contract', () => {
    it('owns invariant unit roles and only mathematical witness/range choices', () => {
        expect(spec.generalLabels).toEqual([Area.Division, Scope.FractionDividend, Scope.IntegerDivisor, Scope.UnitFractions,
            Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]);
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        const ranges = [5,10];
        for (const [labels, relationProfile] of [[[], 'unit-dividend-basic'], [[Area.Multiplication], 'unit-dividend-inverse'], [[Area.Equation], 'unit-dividend-equation']] as const) {
            for (const upper of ranges) {
                const rangeLabel = ({5: Scope.NumbersSmaller5, 10: Scope.NumbersSmaller10, 20: Scope.NumbersSmaller20, 100: Scope.NumbersSmaller100} as Record<number, string>)[upper]!;
                const request = [...labels, rangeLabel];
                setSeed(17); const direct = extractConfig(schema, request); const state = getRandomState();
                expect(direct.config).toEqual({relationProfile, range: createCanonicalNumericRange(upper)});
                setSeed(17); const planned = resolveSchemaChoices(schema, request, {relationProfile: labels, range: [rangeLabel]});
                expect(planned).toEqual(direct);
                expect(getRandomState()).toBe(state);
            }
        }
        expect(() => extractConfig(schema, [Area.Equation, Area.Multiplication])).toThrow();
    });

    it('retains broad-request witness choices and the explicit-unit basic preference', () => {
        const profiles = (labels: string[]) => normalizeSchemaChoices(schema, labels, 'generator')
            .find(field => field.field === 'relationProfile')!.alternatives.map(choice => choice.labels);
        expect(profiles([Scope.FractionDividend, Scope.IntegerDivisor])).toEqual([[Area.Equation], [Area.Multiplication], []]);
        expect(profiles([Scope.UnitFractions])).toEqual([[]]);
        expect(profiles([Scope.UnitFractions, Area.Equation])).toEqual([[Area.Equation]]);
        expect(profiles([Scope.UnitFractions, Area.Multiplication])).toEqual([[Area.Multiplication]]);
        // Direct unqualified extraction deliberately retains the empty profile's basic default.
        expect(extractConfig(schema, [Scope.NumbersSmaller5]).config.relationProfile).toBe('unit-dividend-basic');
    });

    it('preserves the original generic-notation boundary while admitting explicit unit-fraction mathematics', () => {
        const probe = (labels: string[]) => planCompatibility({identity: {targetId: 'unit-boundary', generatorId: spec.generatorId, viewId: 'proof'},
            targetLabels: labels, generatorLabels: spec.generalLabels, viewLabels: [], generatorRules: spec.compatibility,
            fields: normalizeSchemaChoices(schema, labels, 'generator')});
        expect(probe([Scope.FractionNumbers]).supported).toBe(false);
        expect(probe([Scope.FractionNumbers, Scope.UnitFractions]).supported).toBe(true);
        expect(probe([Scope.FractionDividend, Scope.IntegerDivisor, Scope.UnitFractions]).supported).toBe(true);
    });
});

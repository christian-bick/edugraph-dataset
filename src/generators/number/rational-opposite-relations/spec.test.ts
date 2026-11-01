import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {RationalOppositeRelationsGenerator} from './generator.ts';
import {RationalOppositeRelationsGeneratorSchema, spec} from './spec.ts';

const invariants = [Area.SignNotation, Scope.RationalNumbers, Scope.NumbersWithZero, Scope.NumbersWithNegatives];
const targets = [
    ['double-opposite', [Area.RulesOfSigns, Area.SignNotation, Scope.RationalNumbers, Ability.Interpretation], 'iterated-negation', [Area.RulesOfSigns]],
    ['opposite-line-locations', [Area.SignNotation, Scope.RationalNumbers, Scope.NumbersWithNegatives, Scope.Numberline, Ability.Interpretation], 'nonzero-opposition', []],
    ['zero-opposite', [Area.Zero, Area.SignNotation, Scope.NumbersWithZero, Scope.Numberline, Ability.Interpretation], 'zero-fixed-point', [Area.Zero]]
] as const;

describe('opposite relation capability ownership', () => {
    it('keeps always-present zero/negative reference values invariant and claims no learner action', () => {
        expect(spec.generalLabels).toEqual(invariants);
        for (const label of Object.values(Ability)) expect(spec.generalLabels).not.toContain(label);
        expect(RationalOppositeRelationsGeneratorSchema.relation[0]).toEqual([Area.RulesOfSigns, Area.Zero]);
    });

    it.each(targets)('resolves the real 6.NS.C.6a-%s target without a magnitude label', (_name, target, relation, selected) => {
        const resolved = extractConfig(RationalOppositeRelationsGeneratorSchema, [...target]);
        expect(resolved.config).toMatchObject({relation});
        expect([createCanonicalNumericRange(5), createCanonicalNumericRange(10)]).toContainEqual(resolved.config.range);
        expect(new Set(resolved.resolvedLabels)).toEqual(new Set([...selected,
            resolved.config.range!.max === 5 ? Scope.NumbersSmaller5 : Scope.NumbersSmaller10]));
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const problem = generateWithLabels(new RationalOppositeRelationsGenerator(), [...target])!;
            expect(problem.labels).toHaveLength(selected.length + 1);
            for (const label of selected) expect(problem.labels).toContain(label);
            expect(problem.data.kind).toBe('rational-opposite-relations');
            if (relation === 'nonzero-opposition') expect(problem.data.original.sign).not.toBe(0);
            if (relation === 'zero-fixed-point') expect(problem.data.original.sign).toBe(0);
        }
    });

    it.each([[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10]] as const)(
        'resolves the absolute range %s independently of the relation Area', (label, max) => {
            const resolved = extractConfig(RationalOppositeRelationsGeneratorSchema, [...invariants, Area.RulesOfSigns, label]);
            expect(resolved.config).toEqual({relation: 'iterated-negation', range: createCanonicalNumericRange(max)});
            expect(new Set(resolved.resolvedLabels)).toEqual(new Set([Area.RulesOfSigns, label]));
            const result = generateWithLabels(new RationalOppositeRelationsGenerator(), [...invariants, Area.RulesOfSigns, label])!;
            const required = result.data.original.sign === 0 ? result.data.oppositePair.commonMagnitude : result.data.original.magnitude;
            expect(required.numerator).toBeLessThanOrEqual(max * required.denominator);
            expect(required.numerator / required.denominator).toBeGreaterThan(max === 5 ? -1 : 5);
        }
    );

    it('supports the explicit accounted no-Area fallback and rejects competing Area bundles', () => {
        expect(RationalOppositeRelationsGeneratorSchema.relation[1]([])).toBe('nonzero-opposition');
        expect(() => RationalOppositeRelationsGeneratorSchema.relation[1]([Area.RulesOfSigns, Area.Zero])).toThrow('Unsupported exact label combination');
    });

    it('keeps canonical mathematics independent of learner Ability', () => {
        setSeed(178);
        const first = generateWithLabels(new RationalOppositeRelationsGenerator(), [...invariants, Area.RulesOfSigns, Ability.Interpretation]);
        setSeed(178);
        expect(generateWithLabels(new RationalOppositeRelationsGenerator(), [...invariants, Area.RulesOfSigns, Ability.ProcedureExecution])).toEqual(first);
    });
});

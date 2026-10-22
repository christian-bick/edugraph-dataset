import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {RationalOppositeRelationsGenerator} from './generator.ts';
import {RationalOppositeRelationsGeneratorSchema, spec} from './spec.ts';

const invariants = [Area.SignNotation, Scope.RationalNumbers, Scope.NumbersWithZero, Scope.NumbersWithNegatives];
const targets = [
    ['double-opposite', [Area.RulesOfSigns, Area.SignNotation, Scope.RationalNumbers, Ability.Interpretation], 'iterated-negation', [Area.RulesOfSigns]],
    ['opposite-line-locations', [Area.SignNotation, Scope.RationalNumbers, Scope.NumbersWithNegatives, Scope.Numberline, Ability.Interpretation], 'nonzero-opposition', []],
    ['zero-opposite', [Area.ZeroConcept, Area.SignNotation, Scope.NumbersWithZero, Scope.Numberline, Ability.Interpretation], 'zero-fixed-point', [Area.ZeroConcept]]
] as const;

describe('opposite relation capability ownership', () => {
    it('keeps always-present zero/negative reference values invariant and claims no learner action', () => {
        expect(spec.generalLabels).toEqual(invariants);
        for (const label of Object.values(Ability)) expect(spec.generalLabels).not.toContain(label);
        expect(RationalOppositeRelationsGeneratorSchema.relation[0]).toEqual([Area.RulesOfSigns, Area.ZeroConcept]);
    });

    it.each(targets)('resolves the real 6.NS.C.6a-%s target without a magnitude label', (_name, target, relation, selected) => {
        const resolved = extractConfig(RationalOppositeRelationsGeneratorSchema, [...target]);
        expect(resolved.config).toEqual({relation, range: {min: 0, max: Number.MAX_SAFE_INTEGER}});
        expect(resolved.resolvedLabels).toEqual(selected);
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const problem = generateWithLabels(new RationalOppositeRelationsGenerator(), [...target])!;
            expect(problem.labels).toEqual(selected);
            expect(problem.data.kind).toBe('rational-opposite-relations');
            if (relation === 'nonzero-opposition') expect(problem.data.original.sign).not.toBe(0);
            if (relation === 'zero-fixed-point') expect(problem.data.original.sign).toBe(0);
        }
    });

    it.each([[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10]] as const)(
        'resolves the absolute range %s independently of the relation Area', (label, max) => {
            const resolved = extractConfig(RationalOppositeRelationsGeneratorSchema, [...invariants, Area.RulesOfSigns, label]);
            expect(resolved.config).toEqual({relation: 'iterated-negation', range: {min: 0, max}});
            expect(new Set(resolved.resolvedLabels)).toEqual(new Set([Area.RulesOfSigns, label]));
            const result = generateWithLabels(new RationalOppositeRelationsGenerator(), [...invariants, Area.RulesOfSigns, label])!;
            expect(result.data.axis.maximum.numerator).toBeLessThanOrEqual(max * result.data.axis.maximum.denominator);
        }
    );

    it('supports the explicit accounted no-Area fallback and rejects competing Area bundles', () => {
        expect(RationalOppositeRelationsGeneratorSchema.relation[1]([])).toBe('nonzero-opposition');
        expect(() => RationalOppositeRelationsGeneratorSchema.relation[1]([Area.RulesOfSigns, Area.ZeroConcept])).toThrow('Unsupported exact label combination');
    });

    it('keeps canonical mathematics independent of learner Ability', () => {
        setSeed(178);
        const first = generateWithLabels(new RationalOppositeRelationsGenerator(), [...invariants, Area.RulesOfSigns, Ability.Interpretation]);
        setSeed(178);
        expect(generateWithLabels(new RationalOppositeRelationsGenerator(), [...invariants, Area.RulesOfSigns, Ability.ProcedureExecution])).toEqual(first);
    });
});

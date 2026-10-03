import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {FractionQuotientModelGenerator} from './generator.ts';
import {FractionQuotientModelGeneratorSchema, spec} from './spec.ts';

const wholeRoles = [Scope.IntegerDividend, Scope.IntegerDivisor,
    Scope.FractionQuotient, Scope.NumbersWithoutNegatives];
const unitDividendRoles = [Scope.FractionDividend, Scope.IntegerDivisor,
    Scope.UnitFractions, Scope.NumbersWithoutNegatives];
const unitDivisorRoles = [Scope.IntegerDividend, Scope.FractionDivisor,
    Scope.UnitFractions, Scope.NumbersWithoutNegatives];

const targetCases = [
    ['5.NF.B.3-interpret-quotient', [Area.FractionNotation, Scope.FractionNumbers,
        Ability.Interpretation], [Scope.FractionNumbers], 'fraction-as-quotient'],
    ['5.NF.B.3-whole-number-division-problems', [Area.Equation, ...wholeRoles,
        Ability.TextualReception, Ability.ProcedureExecution],
    [Area.Equation, ...wholeRoles], 'whole-sharing-equation'],
    ['5.NF.B.7a-interpret-unit-fraction-dividend', [...unitDividendRoles,
        Ability.Interpretation], unitDividendRoles, 'unit-dividend-basic'],
    ['5.NF.B.7a-compute-unit-fraction-dividend', [...unitDividendRoles,
        Ability.ProcedureExecution], unitDividendRoles, 'unit-dividend-basic'],
    ['5.NF.B.7a-create-division-story', [...unitDividendRoles,
        Ability.TextualArticulation], unitDividendRoles, 'unit-dividend-basic'],
    ['5.NF.B.7a-explain-inverse-multiplication', [Area.Multiplication,
        ...unitDividendRoles, Ability.ProcedureUnderstanding],
    [Area.Multiplication, ...unitDividendRoles], 'unit-dividend-inverse'],
    ['5.NF.B.7b-interpret-unit-fraction-divisor', [...unitDivisorRoles,
        Ability.Interpretation], unitDivisorRoles, 'unit-divisor-basic'],
    ['5.NF.B.7b-compute-unit-fraction-divisor', [...unitDivisorRoles,
        Ability.ProcedureExecution], unitDivisorRoles, 'unit-divisor-basic'],
    ['5.NF.B.7b-create-division-story', [...unitDivisorRoles,
        Ability.TextualArticulation], unitDivisorRoles, 'unit-divisor-basic'],
    ['5.NF.B.7b-explain-inverse-multiplication', [Area.Multiplication,
        ...unitDivisorRoles, Ability.ProcedureUnderstanding],
    [Area.Multiplication, ...unitDivisorRoles], 'unit-divisor-inverse'],
    ['5.NF.B.7c-unit-fraction-division-problems (dividend)', [Area.Equation,
        ...unitDividendRoles, Ability.TextualReception, Ability.ProcedureExecution],
    [Area.Equation, ...unitDividendRoles], 'unit-dividend-equation'],
    ['5.NF.B.7c-unit-fraction-division-problems (divisor)', [Area.Equation,
        ...unitDivisorRoles, Ability.TextualReception, Ability.ProcedureExecution],
    [Area.Equation, ...unitDivisorRoles], 'unit-divisor-equation']
] as const;

describe('fraction-quotient-model schema integration', () => {
    it('keeps only division invariant and all learner Abilities out of the producer', () => {
        expect(spec.generalLabels).toEqual([Area.Division]);
        expect(spec.generalLabels).not.toContain(Area.Equation);
        expect(spec.generalLabels).not.toContain(Area.Multiplication);
        expect(spec.generalLabels).not.toContain(Area.FractionNotation);
        for (const label of Object.values(Ability)) expect(spec.generalLabels).not.toContain(label);
    });

    it.each(targetCases)('resolves %s to the exact mathematical profile', (_name, requested,
        selected, relationProfile) => {
        const labels = [Area.Division, ...requested];
        const resolved = extractConfig(FractionQuotientModelGeneratorSchema, labels);
        expect(resolved.config).toEqual({relationProfile});
        const expectedLabels: readonly string[] = selected;
        expect(new Set<string>(resolved.resolvedLabels)).toEqual(new Set<string>(expectedLabels));
        const problem = generateWithLabels(new FractionQuotientModelGenerator(), labels)!;
        expect(new Set<string>(problem.labels)).toEqual(new Set<string>(expectedLabels));
        expect(problem.data.equationWitness !== undefined).toBe(relationProfile.endsWith('-equation'));
        expect(problem.data.multiplicationWitness !== undefined).toBe(relationProfile.endsWith('-inverse'));
    });
});

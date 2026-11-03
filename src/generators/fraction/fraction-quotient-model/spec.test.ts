import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {FractionQuotientModelGenerator} from './generator.ts';
import {FractionQuotientModelGeneratorSchema, spec} from './spec.ts';
import {quotientRangeLabels} from './range-profile.ts';

const wholeRoles = [Scope.IntegerDividend, Scope.IntegerDivisor,
    Scope.FractionQuotient, Scope.NumbersWithoutNegatives];
const unitDivisorRoles = [Scope.IntegerDividend, Scope.FractionDivisor,
    Scope.UnitFractions, Scope.NumbersWithoutNegatives];
const relationSchema = {relationProfile: FractionQuotientModelGeneratorSchema.relationProfile};

const targetCases = [
    ['5.NF.B.3-interpret-quotient', [Area.FractionNotation, Scope.FractionNumbers,
        Ability.Interpretation], [Scope.FractionNumbers], 'fraction-as-quotient'],
    ['5.NF.B.3-whole-number-division-problems', [Area.Equation, ...wholeRoles,
        Ability.TextualReception, Ability.ProcedureExecution],
    [Area.Equation, ...wholeRoles], 'whole-sharing-equation'],
    ['5.NF.B.7b-interpret-unit-fraction-divisor', [...unitDivisorRoles,
        Ability.Interpretation], unitDivisorRoles, 'unit-divisor-basic'],
    ['5.NF.B.7b-compute-unit-fraction-divisor', [...unitDivisorRoles,
        Ability.ProcedureExecution], unitDivisorRoles, 'unit-divisor-basic'],
    ['5.NF.B.7b-create-division-story', [...unitDivisorRoles,
        Ability.TextualArticulation], unitDivisorRoles, 'unit-divisor-basic'],
    ['5.NF.B.7b-explain-inverse-multiplication', [Area.Multiplication,
        ...unitDivisorRoles, Ability.ProcedureUnderstanding],
    [Area.Multiplication, ...unitDivisorRoles], 'unit-divisor-inverse'],
    ['5.NF.B.7c-unit-fraction-division-problems (divisor)', [Area.Equation,
        ...unitDivisorRoles, Ability.TextualReception, Ability.ProcedureExecution],
    [Area.Equation, ...unitDivisorRoles], 'unit-divisor-equation']
] as const;

const unchangedZeroAbsenceRequests = [
    ['fraction-as-quotient', [Scope.NumbersWithoutZero]],
    ['fraction-as-quotient', [Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]]
] as const;

describe('fraction-quotient-model schema integration', () => {
    it.each(unchangedZeroAbsenceRequests)('completes the unchanged %s request without adding profile choices',
        (relationProfile, requested) => {
            const [domain] = normalizeSchemaChoices(relationSchema, requested, 'generator');
            expect(domain.alternatives).toHaveLength(1);
            const selected = domain.alternatives[0].labels;
            expect(selected).toContain(Scope.NumbersWithoutZero);
            expect(resolveSchemaChoices(relationSchema, requested,
                {relationProfile: selected}).config).toEqual({relationProfile});

            for (let seed = 0; seed < 16; seed++) {
                setSeed(seed);
                const unchanged = extractConfig(FractionQuotientModelGeneratorSchema, [...requested]);
                const continuation = getRandomState();
                setSeed(seed);
                const canonical = extractConfig(FractionQuotientModelGeneratorSchema, [...selected]);
                expect(unchanged).toEqual(canonical);
                expect(unchanged.config.relationProfile).toBe(relationProfile);
                expect(getRandomState()).toBe(continuation);
            }
        });

    it('keeps five non-unit-dividend profiles without duplicate alias choices', () => {
        const [domain] = normalizeSchemaChoices(relationSchema, [], 'generator');
        expect(domain.alternatives).toHaveLength(5);
        const profiles = domain.alternatives.map(({labels}) => resolveSchemaChoices(
            relationSchema, [], {relationProfile: labels}).config.relationProfile);
        expect(new Set(profiles).size).toBe(5);
    });

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
        setSeed(_name);
        const resolved = extractConfig(FractionQuotientModelGeneratorSchema, labels);
        expect(resolved.config.relationProfile).toBe(relationProfile);
        const numeric = resolved.config.numericProfile;
        const expectedLabels: readonly string[] = [...selected,
            ...(relationProfile === 'fraction-as-quotient'
                ? [Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]
                : relationProfile.startsWith('unit-dividend-') ? [Scope.NumbersWithoutZero]
                    : relationProfile === 'whole-sharing-equation'
                        ? [Scope.IntegerNumbers, Scope.TwoOperands, Scope.SingleDigitLargestOperand] : []),
            ...(numeric === 'proper' ? [Scope.ProperFractions, Scope.NumbersWithoutZero]
                : numeric === 'improper' ? [Scope.ImproperFractions, Scope.NumbersWithoutZero]
                    : [numeric === 'zero' ? Scope.NumbersWithZero : Scope.NumbersWithoutZero])];
        expect(new Set<string>(resolved.resolvedLabels.filter(label => !quotientRangeLabels.includes(label as never))))
            .toEqual(new Set<string>(expectedLabels));
        setSeed(_name);
        const problem = generateWithLabels(new FractionQuotientModelGenerator(), labels)!;
        expect(new Set<string>(problem.labels.filter(label => !quotientRangeLabels.includes(label as never))))
            .toEqual(new Set<string>(expectedLabels));
        expect(problem.data.equationWitness !== undefined).toBe(relationProfile.endsWith('-equation'));
        expect(problem.data.multiplicationWitness !== undefined).toBe(relationProfile.endsWith('-inverse'));
    });

    it('grounds whole-sharing integer presence and width in the explicit original operands', () => {
        const labels = [Area.Equation, ...wholeRoles];
        const [domain] = normalizeSchemaChoices(relationSchema, labels, 'generator');
        expect(domain.alternatives).toHaveLength(1);
        expect(domain.alternatives[0].labels).toEqual(expect.arrayContaining([
            Scope.IntegerNumbers, Scope.TwoOperands, Scope.SingleDigitLargestOperand, Scope.FractionQuotient
        ]));
        for (let seed = 0; seed < 64; seed++) {
            setSeed(seed);
            const problem = generateWithLabels(new FractionQuotientModelGenerator(), labels)!;
            expect(problem.labels).toEqual(expect.arrayContaining([
                Scope.IntegerNumbers, Scope.TwoOperands, Scope.SingleDigitLargestOperand, Scope.FractionQuotient
            ]));
            for (const operand of [problem.data.dividend, problem.data.divisor]) {
                expect(operand.denominator).toBe(1);
                expect(operand.numerator).toBeGreaterThanOrEqual(0);
                expect(operand.numerator).toBeLessThan(10);
            }
        }
        const evaluation = createLabelDependencyEvaluator().evaluate([
            Area.Division, ...domain.alternatives[0].labels
        ]);
        expect(evaluation.assessments.filter(item => ['numberKind', 'operandCount', 'operandDigits']
            .includes(item.facet)).every(item => item.status === 'satisfied')).toBe(true);
    });
});

import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it, vi} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import * as randomSource from '../../../lib/random.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {CurrencyArithmeticGenerator} from './generator.ts';
import {coinDenominations, CurrencyArithmeticGeneratorSchema, spec} from './spec.ts';

const representations = [
    {name: 'banknotes', labels: [Scope.Banknotes, Scope.MajorDenomination], maxCount: 3},
    ...coinDenominations.flatMap(denomination => [
        {name: `coins ${denomination}`, labels: [Scope.Coins, denomination],
            maxCount: denomination === Scope.QuarterDenomination ? 3 : 6},
        {name: `mixed ${denomination}`, labels: [Scope.Coins, Scope.Banknotes, Scope.MajorDenomination, denomination], maxCount: 3}
    ])
];

function plan(labels: string[]) {
    return planCompatibility({
        identity: {targetId: 'currency-test', generatorId: 'currency-arithmetic', viewId: 'currency-word-problem'},
        targetLabels: labels,
        generatorLabels: spec.generalLabels ?? [],
        viewLabels: [Ability.TextualReception, Scope.ArabicNumerals, Scope.Base10],
        fields: normalizeSchemaChoices(CurrencyArithmeticGeneratorSchema, labels, 'generator'),
        generatorRules: spec.compatibility
    });
}

describe('CurrencyArithmeticGenerator spec', () => {
    it.each([
        [Scope.QuarterDenomination, 25],
        [Scope.TenthDenomination, 10],
        [Scope.TwentiethDenomination, 5],
        [Scope.HundredthDenomination, 1]
    ] as const)('resolves %s coin values', (denomination, cents) => {
        setSeed(4);
        const problem = generateWithLabels(new CurrencyArithmeticGenerator(), [
            Scope.Dollar,
            Scope.SingleStep,
            Scope.Coins,
            denomination,
            Area.Addition,
            Ability.TextualReception
        ])!;

        expect(problem.data.amounts.flatMap(amount => amount.items).every(item => item.denominationCents === cents)).toBe(true);
        expect(problem.labels).toEqual(expect.arrayContaining([Scope.Coins, denomination, Area.Addition]));
    });

    it('resolves a banknote-only subtraction without inventing a coin denomination', () => {
        setSeed(7);
        const problem = generateWithLabels(new CurrencyArithmeticGenerator(), [
            Scope.Dollar,
            Scope.SingleStep,
            Scope.Banknotes,
            Scope.MajorDenomination,
            Area.Subtraction,
            Ability.TextualReception
        ])!;

        expect(problem.data.operation).toBe('subtraction');
        expect(problem.data.amounts.flatMap(amount => amount.items).every(item => item.kind === 'banknote')).toBe(true);
        for (const denomination of [
            Scope.QuarterDenomination,
            Scope.TenthDenomination,
            Scope.TwentiethDenomination,
            Scope.HundredthDenomination
        ]) {
            expect(problem.labels).not.toContain(denomination);
        }
    });

    it.each([Area.Addition, Area.Subtraction])('does not parameterize quantity invariants for %s', operation => {
        const labels = [Scope.Dollar, Scope.SingleStep, Scope.Coins, Scope.Banknotes,
            Scope.MajorDenomination, Scope.QuarterDenomination, operation, Ability.TextualReception];
        const generator = new CurrencyArithmeticGenerator();
        setSeed('currency-invariant-resolution');
        const original = generateWithLabels(generator, labels);
        const originalState = getRandomState();
        setSeed('currency-invariant-resolution');
        const explicit = generateWithLabels(generator, [...labels, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]);
        expect(explicit).toEqual(original);
        expect(getRandomState()).toBe(originalState);
    });

    it('keeps the existing mathematical fields and valid denomination fallback contracts', () => {
        expect(Object.keys(CurrencyArithmeticGeneratorSchema)).toEqual([
            'operation', 'useCoins', 'useBanknotes', 'coinDenomination'
        ]);
        expect(findSchemaFallbackContractIssues(CurrencyArithmeticGeneratorSchema)).toEqual([]);
        expect(spec.generalLabels).not.toContain(Scope.IntegerNumbers);
    });

    it.each(representations)('declares only supported integer widths for $name in both operations', profile => {
        for (const operation of [Area.Addition, Area.Subtraction]) {
            const labels = [operation, ...profile.labels];
            const result = plan(labels);
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error('Currency profile must remain admitted.');
            const enumeration = enumerateDependencyAuditSelections(result.plan);
            expect(enumeration.status).toBe('complete');
            expect(enumeration.selections).toHaveLength(1);
            const selected = enumeration.selections[0].labels;
            const mixed = profile.labels.includes(Scope.Coins) && profile.labels.includes(Scope.Banknotes);
            const additionConversion = operation === Area.Addition && (profile.labels.includes(Scope.QuarterDenomination)
                || profile.labels.includes(Scope.TenthDenomination));
            const integer = !mixed && !additionConversion;
            expect(selected.includes(Scope.IntegerNumbers)).toBe(integer);
            expect(selected).not.toContain(Scope.DecimalNumbers);
            const expectedWidth = !integer ? undefined
                : profile.labels.includes(Scope.QuarterDenomination) ? Scope.TwoDigitSmallestOperand
                    : profile.labels.includes(Scope.Banknotes) || profile.labels.includes(Scope.HundredthDenomination)
                        ? Scope.SingleDigitLargestOperand : Scope.TwoDigitLargestOperand;
            expect(selected.filter(label => [Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand,
                Scope.TwoDigitSmallestOperand].includes(label as Scope))).toEqual(expectedWidth ? [expectedWidth] : []);
            const evaluation = createLabelDependencyEvaluator().evaluate(selected);
            expect(evaluation.conflicts).toEqual([]);
            expect(evaluation.assessments.filter(assessment => assessment.status === 'missing'
                && assessment.facet !== 'range').map(assessment => assessment.facet))
                .toEqual(integer ? [] : ['numberKind']);
            if (!integer) continue;

            const selection = enumeration.selections[0];
            const bindings = Object.fromEntries(selection.choices.map(choice => {
                const domain = result.plan.domains.find(field => field.field === choice.field)!;
                return [choice.field, domain.alternatives.find(alternative => alternative.id === choice.alternativeId)!.labels];
            }));
            const {config} = resolveSchemaChoices(CurrencyArithmeticGeneratorSchema, labels, bindings);
            // Enumerate every initial count pair, including equal-count adjustment and subtraction order.
            for (let first = 1; first <= profile.maxCount; first++) {
                for (let second = 1; second <= profile.maxCount; second++) {
                    const random = vi.spyOn(randomSource, 'random')
                        .mockReturnValueOnce((first - 1) / profile.maxCount)
                        .mockReturnValueOnce((second - 1) / profile.maxCount);
                    try {
                        const data = new CurrencyArithmeticGenerator().generate(config)!.data;
                        const amounts = data.amounts.map(amount => amount.totalCents);
                        const operand = expectedWidth === Scope.TwoDigitSmallestOperand
                            ? Math.min(...amounts) : Math.max(...amounts);
                        const displayedValue = operand < 100 ? operand : operand / 100;
                        expect(Number.isInteger(displayedValue)).toBe(true);
                        expect(String(displayedValue).length).toBe(expectedWidth === Scope.SingleDigitLargestOperand ? 1 : 2);
                        const displayedAnswer = data.answerCents < 100 ? data.answerCents : data.answerCents / 100;
                        expect(Number.isInteger(displayedAnswer)).toBe(true);
                    } finally {
                        random.mockRestore();
                    }
                }
            }
        }
    });

    it.each([
        [Area.Addition, Scope.Coins, Scope.QuarterDenomination, Scope.IntegerNumbers],
        [Area.Addition, Scope.Coins, Scope.TenthDenomination, Scope.IntegerNumbers],
        [Area.Subtraction, Scope.Coins, Scope.Banknotes, Scope.QuarterDenomination, Scope.IntegerNumbers],
        [Area.Subtraction, Scope.Coins, Scope.QuarterDenomination, Scope.TwoDigitLargestOperand],
        [Area.Addition, Scope.Coins, Scope.HundredthDenomination, Scope.TwoDigitLargestOperand]
    ])('rejects unsupported integer or width claims in %j', (...labels) => {
        expect(plan(labels).supported).toBe(false);
    });
});

import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec as kindergarten} from '../spec/ccss/kindergarten.ts';
import {spec as gradeTwo} from '../spec/ccss/grade-02.ts';
import {ComparisonGenerator} from '../generators/comparison/generator.ts';
import {ComparisonGeneratorSchema, spec as integerSpec} from '../generators/comparison/spec.ts';
import {DecimalPlaceComparisonGeneratorSchema, spec as decimalSpec} from '../generators/number/decimal-place-comparison/spec.ts';
import {NumbersCompareViewSchema, spec as integerView} from '../visuals/views/numbers/numbers-compare/spec.ts';
import {NumbersDecimalPlaceComparisonViewSchema, spec as decimalView} from '../visuals/views/numbers/numbers-decimal-place-comparison/spec.ts';
import {createGenerationSelectionReceipt} from './compatibility.ts';
import {enumerateDependencyAuditSelections} from './label-dependency-audit.ts';
import {planModelCompatibility} from './model-compatibility.ts';
import {generatePlannedDraw} from './planned-generation.ts';
import {getRandomState} from './random.ts';

const families = [
    ['K.CC.C.7-compare-numerals', kindergarten, 6],
    ['2.NBT.A.4-compare-three-digit', gradeTwo, 8]
] as const;
const targets = families.flatMap(([prefix, spec]) => spec.filter(target => target.id.startsWith(prefix + '~')));

describe('CCSS integer comparison source precision', () => {
    it.each(families)('preserves every %s source permutation with an explicit integer context', (prefix, spec, count) => {
        const family = spec.filter(target => target.id.startsWith(prefix + '~'));
        expect(family).toHaveLength(count);
        for (const target of family) {
            expect(target.labels).toEqual(expect.arrayContaining([Scope.IntegerNumbers, Scope.ArabicNumerals,
                Scope.Base10, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]));
        }
    });

    it.each(targets)('keeps integer mathematics and replay while rejecting decimal substitution for $id', target => {
        const admitted = planModelCompatibility(target,
            {generatorId: integerSpec.generatorId, generalLabels: integerSpec.generalLabels, schema: ComparisonGeneratorSchema, spec: integerSpec},
            {viewId: integerView.viewId, generalLabels: integerView.generalLabels, schema: NumbersCompareViewSchema, spec: integerView});
        expect(admitted.supported).toBe(true);
        if (!admitted.supported) throw new Error('An approved integer comparison target must remain supported.');
        const decimal = planModelCompatibility(target,
            {generatorId: decimalSpec.generatorId, generalLabels: decimalSpec.generalLabels, schema: DecimalPlaceComparisonGeneratorSchema, spec: decimalSpec},
            {viewId: decimalView.viewId, generalLabels: decimalView.generalLabels, schema: NumbersDecimalPlaceComparisonViewSchema, spec: decimalView});
        expect(decimal.supported).toBe(false);

        const generator = new ComparisonGenerator();
        const choices = enumerateDependencyAuditSelections(admitted.plan);
        expect(choices.status).toBe('complete');
        const expectedChoices = target.id.startsWith('K.') && target.labels.includes(Scope.NumbersSmaller10)
            && !target.labels.includes(Scope.Equal) ? 2 : 1;
        expect(choices.selections).toHaveLength(expectedChoices);
        for (const selection of choices.selections) for (const seed of [0, 19, 1003]) {
            const sampleKey = `${target.id}#comparison#numbers-compare#train#question#${seed}`;
            const input = {generator, generatorSpec: integerSpec, viewSchema: NumbersCompareViewSchema, viewSpec: integerView,
                plan: admitted.plan, sampleKey, seed, attempt: 1, replay: {version: 1 as const, sampleKey, seed, attempt: 1,
                    selection: createGenerationSelectionReceipt(admitted.plan, selection.choices)}};
            const first = generatePlannedDraw(input), continuation = getRandomState();
            expect(first.stub).not.toBeNull();
            const {num1, num2} = first.stub!.data;
            expect(Number.isInteger(num1) && Number.isInteger(num2)).toBe(true);
            const kindergartenTarget = target.id.startsWith('K.');
            expect(Math.min(num1, num2)).toBeGreaterThanOrEqual(kindergartenTarget ? 1 : 100);
            expect(Math.max(num1, num2)).toBeLessThanOrEqual(kindergartenTarget ? 10 : 999);
            expect(first.labels).toContain(Scope.IntegerNumbers);
            expect(generatePlannedDraw({...input, replay: first.replay})).toEqual(first);
            expect(getRandomState()).toBe(continuation);
        }
    });
});

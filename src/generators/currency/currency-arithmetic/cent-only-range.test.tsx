import {Area, Scope} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {CurrencyArithmeticGenerator} from './generator.ts';
import {CurrencyArithmeticGeneratorSchema as schema, spec} from './spec.ts';
import {centOnlyRangeProfiles, centOnlyRowsForRange} from './numeric-domain.ts';
import {spec as viewSpec} from '../../../visuals/views/currency/currency-word-problem/spec.ts';

let View: typeof import('../../../visuals/views/currency/currency-word-problem/view.tsx')['CurrencyWordProblem'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    ({CurrencyWordProblem: View} = await import('../../../visuals/views/currency/currency-word-problem/view.tsx'));
});
afterAll(() => vi.unstubAllGlobals());
const slices = [
    {denomination: 5, label: Scope.TwentiethDenomination, operation: 'addition', area: Area.Addition},
    {denomination: 5, label: Scope.TwentiethDenomination, operation: 'subtraction', area: Area.Subtraction},
    {denomination: 10, label: Scope.TenthDenomination, operation: 'subtraction', area: Area.Subtraction}
] as const;
const makePlan = (labels: string[]) => planCompatibility({identity: {targetId: 'cent-profile', generatorId: spec.generatorId,
    viewId: viewSpec.viewId}, targetLabels: labels, generatorLabels: spec.generalLabels!, viewLabels: viewSpec.generalLabels!,
    fields: normalizeSchemaChoices(schema, labels, 'generator'), generatorRules: spec.compatibility});

describe('nickel arithmetic and dime subtraction canonical ranges', () => {
    it('preserves all108 original count tickets and duplicate weights, with cents throughout Q/S', () => {
        const expected = new Map<string, number>(), seen = new Map<string, number>();
        for (const slice of slices) for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
            let first = a === b ? a + 1 : a, second = b;
            if (slice.operation === 'subtraction' && first < second) [first, second] = [second, first];
            const answer = slice.operation === 'addition' ? first + second : first - second;
            const key = [slice.denomination, slice.operation, first, second, answer].join(':');
            expected.set(key, (expected.get(key) ?? 0) + 1);
        }
        const generator = new CurrencyArithmeticGenerator(), draw = vi.spyOn(rng, 'random');
        const cells: Record<string, number> = {};
        try {
            for (const slice of slices) for (const {range, labels} of centOnlyRangeProfiles) {
                const rows = centOnlyRowsForRange(slice.operation, slice.denomination, range);
                if (!rows.length) continue;
                cells[`${slice.denomination}:${slice.operation}:${range.min}:${range.max}`] = rows.length;
                const targetLabels = [slice.area, Scope.Coins, slice.label, ...labels];
                const plan = makePlan(targetLabels);
                if (!plan.supported) throw new Error('Cents-only profile must be admitted.');
                const preparedView = resolvePlannedConfigurations({generatorSchema: schema, viewSchema: {}, generatorSpec: spec,
                    viewSpec, plan: plan.plan, sampleKey: 'cent-profile#currency-arithmetic#currency-word-problem#train#question#inst:0',
                    attempt: 1, seed: 0}).view;
                for (let index = 0; index < rows.length; index++) {
                    draw.mockClear().mockReturnValue((index + 0.5) / rows.length);
                    const {data} = generator.generate({operation: slice.area, useCoins: true, useBanknotes: false,
                        coinDenomination: slice.label, range})!;
                    const amounts = data.amounts.map(amount => amount.totalCents);
                    const values = [slice.denomination, ...amounts, data.answerCents];
                    expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                    expect(Math.max(...values)).toBeLessThan(100);
                    expect(range.min).toBe(slice.denomination);
                    const key = [slice.denomination, slice.operation,
                        ...data.amounts.map(amount => amount.items[0].count), data.answerCents / slice.denomination].join(':');
                    seen.set(key, (seen.get(key) ?? 0) + 1);
                    expect(draw).toHaveBeenCalledTimes(1);
                    for (const isSolutionView of [false, true]) {
                        const markup = renderToStaticMarkup(<View payload={{viewId: viewSpec.viewId,
                            problem: {type: 'arithmetic', data, labels: []}, targetLabels, seed: 0, isSolutionView, preparedView}} />);
                        expect(markup).toContain(`${amounts[0]}¢`);
                        expect(markup).toContain(`${amounts[1]}¢`);
                        expect(markup).toContain(`${slice.denomination}¢`);
                        expect(markup).not.toContain('$');
                        if (isSolutionView) expect(markup).toContain(`${data.answerCents}¢`);
                    }
                }
            }
            expect(seen).toEqual(expected);
            expect(cells).toEqual({'5:addition:5:20': 5, '5:addition:5:100': 31,
                '5:subtraction:5:10': 3, '5:subtraction:5:20': 12, '5:subtraction:5:100': 21,
                '10:subtraction:10:20': 3, '10:subtraction:10:100': 33});
        } finally { draw.mockRestore(); }
    });

    it('resolves allseven cells directly/planned with no dependency findings while cross-unit branches stay separate', () => {
        const evaluator = createLabelDependencyEvaluator();
        let cells = 0;
        for (const slice of slices) {
            const target = [slice.area, Scope.Coins, slice.label];
            const plan = makePlan(target);
            if (!plan.supported) throw new Error('Existing source must remain supported.');
            for (const selection of enumerateDependencyAuditSelections(plan.plan).selections) {
                const bindings = Object.fromEntries(selection.choices.map(choice => {
                    const field = plan.plan.domains.find(field => field.field === choice.field)!;
                    return [choice.field, field.alternatives.find(alternative => alternative.id === choice.alternativeId)!.labels];
                }));
                const direct = extractConfig(schema, selection.labels).config;
                expect(direct).toEqual(resolveSchemaChoices(schema, target, bindings).config);
                expect(direct.range).not.toBe(false);
                const evaluation = evaluator.evaluate(selection.labels);
                expect(evaluation.errors).toEqual([]);
                expect(evaluation.conflicts).toEqual([]);
                expect(evaluation.assessments.filter(item => item.status === 'missing')).toEqual([]);
                cells++;
            }
        }
        expect(cells).toBe(7);
        for (const labels of [[Area.Addition, Scope.Coins, Scope.TenthDenomination],
            [Area.Subtraction, Scope.Coins, Scope.Banknotes, Scope.TwentiethDenomination]])
            expect(extractConfig(schema, labels).config.range).toBeDefined();
    });

    it('rejects missing, altered and operation-infeasible profiles before randomness and replays exactly', () => {
        const generator = new CurrencyArithmeticGenerator(), draw = vi.spyOn(rng, 'random');
        const config = {operation: Area.Addition, useCoins: true, useBanknotes: false,
            coinDenomination: Scope.TwentiethDenomination} as const;
        const profile = centOnlyRangeProfiles.find(profile => profile.range.min === 5 && profile.range.max === 20)!;
        try {
            expect(() => generator.generate(config)).toThrow();
            expect(() => generator.generate({...config, range: false} as never)).toThrow();
            expect(() => generator.generate({...config, range: {...profile.range, minimumBelow: 11}})).toThrow();
            expect(centOnlyRowsForRange('addition', 10, profile.range)).toEqual([]);
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
        rng.setSeed('cent-replay');
        const first = generator.generate({...config, range: profile.range}), continuation = rng.random();
        rng.setSeed('cent-replay');
        expect(generator.generate({...config, range: profile.range})).toEqual(first);
        expect(rng.random()).toBe(continuation);
    });
});

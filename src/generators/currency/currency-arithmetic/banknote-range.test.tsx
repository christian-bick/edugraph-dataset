import {Area, Scope} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import type {CurrencyAmount, CurrencyArithmeticProblem} from '../../../types/problems.ts';
import {CurrencyArithmeticGenerator} from './generator.ts';
import {CurrencyArithmeticGeneratorSchema as schema, spec} from './spec.ts';
import {banknoteRangeProfiles, banknoteRowsForRange} from './numeric-domain.ts';
import {spec as viewSpec} from '../../../visuals/views/currency/currency-word-problem/spec.ts';

let View: typeof import('../../../visuals/views/currency/currency-word-problem/view.tsx')['CurrencyWordProblem'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    ({CurrencyWordProblem: View} = await import('../../../visuals/views/currency/currency-word-problem/view.tsx'));
});
afterAll(() => vi.unstubAllGlobals());

describe('banknotes-only canonical ranges', () => {
    it('retains every original count draw with exact duplicate weights and both question/solution projections', () => {
        const expected = new Map<string, number>(), seen = new Map<string, number>();
        for (const operation of ['addition', 'subtraction']) for (let first = 1; first <= 3; first++) for (let second = 1; second <= 3; second++) {
            let left = first === second ? first + 1 : first, right = second;
            if (operation === 'subtraction' && left < right) [left, right] = [right, left];
            const answer = operation === 'addition' ? left + right : left - right;
            const key = [operation, left, right, answer].join(':');
            expected.set(key, (expected.get(key) ?? 0) + 1);
        }
        const generator = new CurrencyArithmeticGenerator(), draw = vi.spyOn(rng, 'random');
        let tickets = 0;
        try {
            for (const operation of ['addition', 'subtraction'] as const) for (const {range, labels} of banknoteRangeProfiles) {
                const rows = banknoteRowsForRange(operation, range);
                if (rows.length === 0) continue;
                const targetLabels = [operation === 'addition' ? Area.Addition : Area.Subtraction,
                    Scope.Banknotes, Scope.MajorDenomination, ...labels];
                const planned = planCompatibility({identity: {targetId: 'banknote-projection', generatorId: spec.generatorId,
                    viewId: viewSpec.viewId}, targetLabels, generatorLabels: spec.generalLabels!, viewLabels: viewSpec.generalLabels!,
                    fields: normalizeSchemaChoices(schema, targetLabels, 'generator'), generatorRules: spec.compatibility});
                if (!planned.supported) throw new Error('Banknote projection profile must remain supported.');
                const preparedView = resolvePlannedConfigurations({generatorSchema: schema, viewSchema: {}, generatorSpec: spec,
                    viewSpec, plan: planned.plan, sampleKey: `banknote-projection#currency-arithmetic#currency-word-problem#train#question#inst:0`,
                    attempt: 1, seed: 0}).view;
                for (let index = 0; index < rows.length; index++) {
                    draw.mockClear().mockReturnValue((index + 0.5) / rows.length);
                    const {data} = generator.generate({operation: operation === 'addition' ? Area.Addition : Area.Subtraction,
                        useCoins: false, useBanknotes: true, coinDenomination: 'none', range})!;
                    const dollars = data.amounts.map(amount => amount.totalCents / 100);
                    const answer = data.answerCents / 100;
                    const key = [operation, ...dollars, answer].join(':');
                    seen.set(key, (seen.get(key) ?? 0) + 1);
                    expect(hasCanonicalRangeWitness([1, ...dollars, answer], range)).toBe(true);
                    expect(Math.max(...dollars)).toBeLessThan(10);
                    expect(draw).toHaveBeenCalledTimes(1);
                    for (const isSolutionView of [false, true]) {
                        const markup = renderToStaticMarkup(<View payload={{viewId: viewSpec.viewId,
                            problem: {type: 'arithmetic', data, labels: []}, targetLabels, seed: 0, isSolutionView, preparedView}} />);
                        expect(markup).toContain(`$${dollars[0]}`);
                        expect(markup).toContain(`$${dollars[1]}`);
                        expect(markup).not.toContain('¢');
                        expect(markup).not.toContain('$100');
                        if (isSolutionView) expect(markup).toContain(`$${answer}`);
                    }
                    tickets++;
                }
            }
            expect(seen).toEqual(expected);
            expect(tickets).toBe(18);
            expect(banknoteRangeProfiles.map(({range}) => banknoteRowsForRange('addition', range).length)).toEqual([8, 1]);
            expect(banknoteRangeProfiles.map(({range}) => banknoteRowsForRange('subtraction', range).length)).toEqual([9, 0]);
        } finally { draw.mockRestore(); }
    });

    it('preserves all882 original coin/mixed count outcomes, their probability weights and draw counts', () => {
        const generator = new CurrencyArithmeticGenerator(), draw = vi.spyOn(rng, 'random');
        let cases = 0;
        try {
            for (const [coinDenomination, denominationCents] of [[Scope.QuarterDenomination, 25],
                [Scope.TenthDenomination, 10], [Scope.TwentiethDenomination, 5], [Scope.HundredthDenomination, 1]] as const) {
                for (const useBanknotes of [false, true]) {
                    const maxCoins = useBanknotes ? 3 : Math.max(2, Math.min(6, Math.floor(75 / denominationCents)));
                    const inputs = (useBanknotes ? [1, 2, 3] : [0]).flatMap(banknotes =>
                        Array.from({length: maxCoins}, (_, index) => ({banknotes, coins: index + 1})));
                    for (const operation of [Area.Addition, Area.Subtraction]) for (const first of inputs) for (const second of inputs) {
                        const amount = (input: typeof first): CurrencyAmount => ({items: [
                            ...(useBanknotes ? [{kind: 'banknote' as const, denominationCents: 100, count: input.banknotes}] : []),
                            {kind: 'coin', denominationCents, count: input.coins}
                        ], totalCents: input.banknotes * 100 + input.coins * denominationCents});
                        let left = amount(first), right = amount(second);
                        if (left.totalCents === right.totalCents) {
                            left.items[0]!.count++;
                            left.totalCents += left.items[0]!.denominationCents;
                        }
                        if (operation === Area.Subtraction && left.totalCents < right.totalCents) [left, right] = [right, left];
                        const expected: CurrencyArithmeticProblem = {operation: operation === Area.Addition ? 'addition' : 'subtraction',
                            amounts: [left, right], answerCents: operation === Area.Addition
                                ? left.totalCents + right.totalCents : left.totalCents - right.totalCents};
                        const values = [first, second].flatMap(input => [
                            ...(useBanknotes ? [(input.banknotes - 0.5) / 3] : []), (input.coins - 0.5) / maxCoins]);
                        draw.mockClear();
                        for (const value of values) draw.mockReturnValueOnce(value);
                        const actual = generator.generate({operation, useCoins: true, useBanknotes, coinDenomination, range: false})!;
                        expect(actual.data).toEqual(expected);
                        expect(draw).toHaveBeenCalledTimes(useBanknotes ? 4 : 2);
                        cases++;
                    }
                }
            }
            expect(cases).toBe(882);
        } finally { draw.mockRestore(); }
    });

    it('admits only the three banknote range cells and keeps coin range findings visible', () => {
        const evaluator = createLabelDependencyEvaluator();
        let banknoteCells = 0;
        for (const operation of [Area.Addition, Area.Subtraction]) {
            const targetLabels = [operation, Scope.Banknotes, Scope.MajorDenomination];
            const result = planCompatibility({identity: {targetId: 'banknote-range', generatorId: spec.generatorId,
                viewId: viewSpec.viewId}, targetLabels, generatorLabels: spec.generalLabels!, viewLabels: viewSpec.generalLabels!,
                fields: normalizeSchemaChoices(schema, targetLabels, 'generator'), generatorRules: spec.compatibility});
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error('Banknote source must remain supported.');
            for (const selection of enumerateDependencyAuditSelections(result.plan).selections) {
                const bindings = Object.fromEntries(selection.choices.map(choice => {
                    const domain = result.plan.domains.find(domain => domain.field === choice.field)!;
                    return [choice.field, domain.alternatives.find(alternative => alternative.id === choice.alternativeId)!.labels];
                }));
                const direct = extractConfig(schema, selection.labels), planned = resolveSchemaChoices(schema, targetLabels, bindings);
                expect(direct.config).toEqual(planned.config);
                expect(planned.config.range).not.toBe(false);
                const evaluation = evaluator.evaluate(selection.labels);
                expect(evaluation.errors).toEqual([]);
                expect(evaluation.conflicts).toEqual([]);
                expect(evaluation.assessments.filter(item => item.status === 'missing')).toEqual([]);
                banknoteCells++;
            }
        }
        expect(banknoteCells).toBe(3);
        const deferred = extractConfig(schema, [Area.Addition, Scope.Coins, Scope.QuarterDenomination]);
        expect(deferred.config.range).toBe(false);
        const evaluation = evaluator.evaluate([...spec.generalLabels!, ...viewSpec.generalLabels!, ...deferred.resolvedLabels]);
        expect(evaluation.assessments.filter(item => item.status === 'missing').map(item => item.facet)).toEqual(['range']);
    });

    it('rejects missing banknote profiles, infeasible subtraction ranges and premature coin range claims', () => {
        const generator = new CurrencyArithmeticGenerator(), draw = vi.spyOn(rng, 'random');
        const base = {operation: Area.Addition, useCoins: false, useBanknotes: true, coinDenomination: 'none'} as const;
        try {
            expect(() => generator.generate(base)).toThrow();
            expect(() => generator.generate({...base, range: false})).toThrow();
            expect(() => generator.generate({...base, operation: Area.Subtraction, range: banknoteRangeProfiles[1]!.range})).toThrow();
            expect(() => generator.generate({...base, useCoins: true, coinDenomination: Scope.QuarterDenomination,
                range: banknoteRangeProfiles[0]!.range})).toThrow();
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });
});

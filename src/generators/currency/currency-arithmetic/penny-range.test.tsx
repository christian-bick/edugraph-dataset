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
import {pennyRangeProfiles, pennyRowsForRange} from './numeric-domain.ts';
import {spec as viewSpec} from '../../../visuals/views/currency/currency-word-problem/spec.ts';

let View: typeof import('../../../visuals/views/currency/currency-word-problem/view.tsx')['CurrencyWordProblem'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    ({CurrencyWordProblem: View} = await import('../../../visuals/views/currency/currency-word-problem/view.tsx'));
});
afterAll(() => vi.unstubAllGlobals());

const pennyTarget = (operation: Area) => [operation, Scope.Coins, Scope.HundredthDenomination];

describe('penny-only canonical ranges', () => {
    it('retains all72 original count draws and duplicate weights with cents in both renderer modes', () => {
        const expected = new Map<string, number>(), seen = new Map<string, number>();
        for (const operation of ['addition', 'subtraction']) for (let first = 1; first <= 6; first++) for (let second = 1; second <= 6; second++) {
            let left = first === second ? first + 1 : first, right = second;
            if (operation === 'subtraction' && left < right) [left, right] = [right, left];
            const answer = operation === 'addition' ? left + right : left - right;
            const key = [operation, left, right, answer].join(':');
            expected.set(key, (expected.get(key) ?? 0) + 1);
        }
        const generator = new CurrencyArithmeticGenerator(), draw = vi.spyOn(rng, 'random');
        let tickets = 0;
        try {
            for (const operation of ['addition', 'subtraction'] as const) for (const {range, labels} of pennyRangeProfiles) {
                const rows = pennyRowsForRange(operation, range);
                if (rows.length === 0) continue;
                const operationLabel = operation === 'addition' ? Area.Addition : Area.Subtraction;
                const targetLabels = [...pennyTarget(operationLabel), ...labels];
                const plan = planCompatibility({identity: {targetId: 'penny-projection', generatorId: spec.generatorId,
                    viewId: viewSpec.viewId}, targetLabels, generatorLabels: spec.generalLabels!, viewLabels: viewSpec.generalLabels!,
                    fields: normalizeSchemaChoices(schema, targetLabels, 'generator'), generatorRules: spec.compatibility});
                if (!plan.supported) throw new Error('Penny profile must remain admitted.');
                const preparedView = resolvePlannedConfigurations({generatorSchema: schema, viewSchema: {},
                    generatorSpec: spec, viewSpec, plan: plan.plan,
                    sampleKey: 'penny-projection#currency-arithmetic#currency-word-problem#train#question#inst:0',
                    attempt: 1, seed: 0}).view;
                for (let index = 0; index < rows.length; index++) {
                    draw.mockClear().mockReturnValue((index + 0.5) / rows.length);
                    const {data} = generator.generate({operation: operationLabel, useCoins: true, useBanknotes: false,
                        coinDenomination: Scope.HundredthDenomination, range})!;
                    const amounts = data.amounts.map(amount => amount.totalCents);
                    const key = [operation, ...amounts, data.answerCents].join(':');
                    seen.set(key, (seen.get(key) ?? 0) + 1);
                    expect(hasCanonicalRangeWitness([1, ...amounts, data.answerCents], range)).toBe(true);
                    expect(Math.max(...amounts)).toBeLessThan(10);
                    expect(draw).toHaveBeenCalledTimes(1);
                    for (const isSolutionView of [false, true]) {
                        const markup = renderToStaticMarkup(<View payload={{viewId: viewSpec.viewId,
                            problem: {type: 'arithmetic', data, labels: []}, targetLabels, seed: 0, isSolutionView, preparedView}} />);
                        expect(markup).toContain(`${amounts[0]}¢`);
                        expect(markup).toContain(`${amounts[1]}¢`);
                        expect(markup).toContain('1¢');
                        expect(markup).not.toContain('$');
                        if (isSolutionView) expect(markup).toContain(`${data.answerCents}¢`);
                    }
                    tickets++;
                }
            }
            expect(seen).toEqual(expected);
            expect(tickets).toBe(72);
            expect(pennyRangeProfiles.map(({range}) => pennyRowsForRange('addition', range).length)).toEqual([10, 22, 4]);
            expect(pennyRangeProfiles.map(({range}) => pennyRowsForRange('subtraction', range).length)).toEqual([24, 12, 0]);
        } finally { draw.mockRestore(); }
    });

    it('resolves allfive penny cells in direct/planned paths and leaves other coins deferred', () => {
        const evaluator = createLabelDependencyEvaluator();
        let cells = 0;
        for (const operation of [Area.Addition, Area.Subtraction]) {
            const targetLabels = pennyTarget(operation);
            const plan = planCompatibility({identity: {targetId: 'penny-range', generatorId: spec.generatorId,
                viewId: viewSpec.viewId}, targetLabels, generatorLabels: spec.generalLabels!, viewLabels: viewSpec.generalLabels!,
                fields: normalizeSchemaChoices(schema, targetLabels, 'generator'), generatorRules: spec.compatibility});
            expect(plan.supported).toBe(true);
            if (!plan.supported) throw new Error('Penny source must remain admitted.');
            for (const selection of enumerateDependencyAuditSelections(plan.plan).selections) {
                const bindings = Object.fromEntries(selection.choices.map(choice => {
                    const domain = plan.plan.domains.find(domain => domain.field === choice.field)!;
                    return [choice.field, domain.alternatives.find(alternative => alternative.id === choice.alternativeId)!.labels];
                }));
                const direct = extractConfig(schema, selection.labels), planned = resolveSchemaChoices(schema, targetLabels, bindings);
                expect(direct.config).toEqual(planned.config);
                expect(planned.config.range).not.toBe(false);
                const evaluation = evaluator.evaluate(selection.labels);
                expect(evaluation.errors).toEqual([]);
                expect(evaluation.conflicts).toEqual([]);
                expect(evaluation.assessments.filter(item => item.status === 'missing')).toEqual([]);
                cells++;
            }
        }
        expect(cells).toBe(5);
        for (const labels of [[Area.Addition, Scope.Coins, Scope.TwentiethDenomination],
            [Area.Addition, Scope.Coins, Scope.Banknotes, Scope.HundredthDenomination]]) {
            const deferred = extractConfig(schema, labels);
            expect(deferred.config.range).toBe(false);
            const evaluation = evaluator.evaluate([...spec.generalLabels!, ...viewSpec.generalLabels!, ...deferred.resolvedLabels]);
            expect(evaluation.assessments.filter(item => item.status === 'missing').map(item => item.facet)).toEqual(['range']);
        }
    });

    it('rejects absent or infeasible penny profiles and replays valid profiles exactly', () => {
        const generator = new CurrencyArithmeticGenerator(), draw = vi.spyOn(rng, 'random');
        const config = {operation: Area.Subtraction, useCoins: true, useBanknotes: false,
            coinDenomination: Scope.HundredthDenomination} as const;
        try {
            expect(() => generator.generate(config)).toThrow();
            expect(() => generator.generate({...config, range: false})).toThrow();
            expect(() => generator.generate({...config, range: pennyRangeProfiles[2]!.range})).toThrow();
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
        rng.setSeed('penny-replay');
        const first = generator.generate({...config, range: pennyRangeProfiles[0]!.range}), continuation = rng.random();
        rng.setSeed('penny-replay');
        expect(generator.generate({...config, range: pennyRangeProfiles[0]!.range})).toEqual(first);
        expect(rng.random()).toBe(continuation);
    });
});

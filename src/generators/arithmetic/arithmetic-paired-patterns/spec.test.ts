import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {setSeed} from '../../../lib/random.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {ArithmeticPairedPatternsGenerator} from './generator.ts';
import {ArithmeticPairedPatternsGeneratorSchema as schema, spec} from './spec.ts';
import {spec as identifyView} from '../../../visuals/views/operations/operations-pattern-correspondence/spec.ts';

describe('ArithmeticPairedPatternsGenerator schema', () => {
    it('preserves the existing target-selected correspondence semantics and paired invariants', () => {
        expect(spec.generalLabels).toEqual([Scope.PairedPatterns, Scope.IntegerNumbers, Scope.NumbersWithoutNegatives]);
        expect(schema.hasCorrespondence[0]).toEqual([Area.PatternCorrespondence]);
        for (const labels of [[], [Area.PatternCorrespondence]]) {
            const domain = normalizeSchemaChoices(schema, labels, 'generator');
            expect(domain.find(field => field.field === 'hasCorrespondence')!.alternatives.map(choice => choice.labels)).toEqual([labels]);
        }
    });

    it('resolves all five feasible mode/range combinations identically through both paths', () => {
        let checked = 0;
        for (const context of [[], [Area.PatternCorrespondence]]) for (const labels of schema.range[2]) {
            if (context.length && labels.includes(Scope.NumbersSmaller10)) continue;
            const target = [...context, ...labels];
            const direct = extractConfig(schema, target);
            const planned = resolveSchemaChoices(schema, target, {hasCorrespondence: context, range: labels});
            expect(planned.config).toEqual(direct.config);
            expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
            const stub = generateWithLabels(new ArithmeticPairedPatternsGenerator(), target)!;
            expect(Boolean(stub.data.correspondence)).toBe(Boolean(context.length));
            checked++;
        }
        expect(checked).toBe(5);
    });

    it('rejects a correspondence upper10 request without silently changing the target or mode', () => {
        const labels = [Area.PatternCorrespondence, Scope.NumbersSmaller10, ...identifyView.generalLabels];
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
        const view = {viewId: identifyView.viewId, generalLabels: identifyView.generalLabels, schema: {}, spec: identifyView};
        expect(planModelCompatibility({id: 'impossible-correspondence-range', labels}, model, view).supported).toBe(false);
        expect(() => extractConfig(schema, labels)).toThrow();
    });

    it('keeps direct broad correspondence fallbacks feasible for every sampled seed', () => {
        for (const seed of [0, 1, 2, 10, 42, 88]) {
            setSeed(seed);
            const direct = extractConfig(schema, [Area.PatternCorrespondence]);
            expect([20, 100]).toContain(direct.config.range!.max);
            expect(direct.config.hasCorrespondence).toBe(true);
        }
    });
});

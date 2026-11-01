import {describe, expect, it} from 'vitest';
import {Ability, Scope} from 'edugraph-ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {FractionTenthsEquivalenceGenerator} from './generator.ts';
import {FractionTenthsEquivalenceGeneratorSchema, spec} from './spec.ts';

describe('fraction-tenths-equivalence schema', () => {
    it('always emits its declared family, including for a broad target', () => {
        const generator = new FractionTenthsEquivalenceGenerator();
        for (const labels of [[], [...spec.generalLabels]]) {
            expect(generateWithLabels(generator, labels)!.data.task).toBe('tenths-to-hundredths');
        }
    });

    it('offers matching-capable proper and equal-whole profiles using the existing schema contract', () => {
        const schema = FractionTenthsEquivalenceGeneratorSchema;
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        expect(normalizeSchemaChoices(schema, [], 'generator')[0].alternatives
            .map(alternative => alternative.labels)).toEqual([
                [Scope.ImproperFractions], [Scope.ProperFractions]
            ]);
        const generator = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
        const view = {viewId: 'magnitude-proof', generalLabels: [Ability.Formalization], schema: {},
            spec: {viewId: 'magnitude-proof', generalLabels: [Ability.Formalization]}};
        for (const [label, value] of [[Scope.ProperFractions, 'proper'], [Scope.ImproperFractions, 'equal-whole']] as const) {
            expect(extractConfig(schema, [label]).config.fractionMagnitude).toBe(value);
            expect(planModelCompatibility({id: 'tenths-proof', labels: [label, Scope.NumbersSmaller100, Ability.Formalization]},
                generator, view).supported).toBe(true);
            const stub = generateWithLabels(new FractionTenthsEquivalenceGenerator(), [label], spec)!;
            expect(stub.labels).toContain(label);
            expect(stub.data.tenths.numerator < 10).toBe(value === 'proper');
        }
        expect(() => extractConfig(schema, [Scope.ProperFractions, Scope.ImproperFractions])).toThrow();
    });
});

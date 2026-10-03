import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticPairedPatternsGenerator} from './generator.ts';
import {ArithmeticPairedPatternsGeneratorSchema, spec} from './spec.ts';

describe('ArithmeticPairedPatternsGenerator schema', () => {
    it('keeps paired structure invariant but selects correspondence evidence', () => {
        expect(spec.generalLabels).toEqual([Scope.PairedPatterns]);
        expect(ArithmeticPairedPatternsGeneratorSchema.hasCorrespondence[0]).toEqual([
            Area.PatternCorrespondence
        ]);
    });

    it.each([
        [[], false],
        [[Area.PatternCorrespondence], true]
    ] as const)('resolves mathematical correspondence %j to %s', (labels, hasCorrespondence) => {
        const domain = normalizeSchemaChoices(ArithmeticPairedPatternsGeneratorSchema,
            labels, 'generator');
        expect(domain[0].alternatives.map(choice => choice.labels)).toEqual([labels]);
        expect(resolveSchemaChoices(ArithmeticPairedPatternsGeneratorSchema, labels,
            {hasCorrespondence: labels})).toEqual({
            config: {hasCorrespondence},
            resolvedLabels: labels
        });

        const stub = generateWithLabels(new ArithmeticPairedPatternsGenerator(), [...labels])!;
        expect(stub.labels).toEqual(labels);
        expect(Boolean(stub.data.correspondence)).toBe(hasCorrespondence);
    });
});

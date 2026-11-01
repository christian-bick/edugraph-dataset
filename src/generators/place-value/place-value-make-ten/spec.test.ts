import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {resolveSchemaChoices, normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {PlaceValueMakeTenGenerator} from './generator.ts';
import {PlaceValueMakeTenGeneratorSchema as schema, spec} from './spec.ts';

describe('make-ten correlated range declarations', () => {
    it('keeps both lower profiles available for a partial upper10 request', () => {
        const [domain] = normalizeSchemaChoices({range: schema.range}, [Scope.NumbersSmaller10], 'generator');
        expect(domain.alternatives).toHaveLength(2);
    });
    it.each([
        [Scope.NumbersWithZero, 0, true], [Scope.NumbersWithoutZero, 0, false], [Scope.NumbersWithoutZero, 5, false]
    ] as const)('resolves zero=%s/lower=%s before generation', (zero, lower, requireZero) => {
        const range = [Scope.NumbersSmaller10, ...(lower ? [Scope.NumbersLarger5] : [])], labels = [zero, ...range];
        const direct = extractConfig(schema, labels);
        const planned = resolveSchemaChoices(schema, labels, {requireZero: [zero], range});
        expect(direct.config).toEqual(planned.config);
        expect([...direct.resolvedLabels].sort()).toEqual([...planned.resolvedLabels].sort());
        expect(direct.config).toEqual({requireZero, range: createCanonicalNumericRange(10, lower)});
        expect(new PlaceValueMakeTenGenerator().generate(direct.config).data.target).toBe(10);
    });
    it('excludes a zero/positive-lower conflict before planning', () => {
        const labels: string[] = [Scope.NumbersWithZero, Scope.NumbersLarger5, Scope.NumbersSmaller10];
        expect(spec.compatibility![0].predicate({has: (_, label) => labels.includes(label), exact: (_, label) => labels.includes(label)})).toBe(false);
    });
});

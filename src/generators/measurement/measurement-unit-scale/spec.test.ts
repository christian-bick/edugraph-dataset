import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {MeasurementUnitScaleGenerator} from './generator.ts';
import {MeasurementUnitScaleGeneratorSchema as schema, spec} from './spec.ts';

describe('MeasurementUnitScaleGenerator schema integration', () => {
    it('requires only a mathematical range, without selecting a learner projection', () => {
        const generator = new MeasurementUnitScaleGenerator();
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const expected = generateWithLabels(generator, [...spec.generalLabels, Ability.Interpretation])!;
            setSeed(seed);
            const result = generateWithLabels(generator, [
                ...spec.generalLabels, Ability.ConceptDerivation
            ])!;
            expect(result.data).toEqual(expected.data);
            expect(new Set(result.labels)).toEqual(new Set(expected.labels));
        }
    });

    it('resolves both full bands through direct and planned paths with no positive lower', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        for (const [label, upper] of [[Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20]] as const) {
            setSeed(19); const direct = extractConfig(schema, [label]), state = getRandomState();
            expect(direct.config).toEqual({range: createCanonicalNumericRange(upper)});
            expect(direct.resolvedLabels).toEqual([label]);
            setSeed(19); const planned = resolveSchemaChoices(schema, [label], {range: [label]});
            expect(planned.config).toEqual(direct.config);
            expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
            expect(getRandomState()).toBe(state);
            const generated = generateWithLabels(new MeasurementUnitScaleGenerator(), [label])!;
            expect(generated.data.smallUnitCount).toBeLessThanOrEqual(upper);
            expect(generated.data.smallUnitCount).toBeGreaterThan(upper === 10 ? 5 : 10);
            expect(generated.data.unitsPerLarge).toBeLessThan(5);
        }
    });
});

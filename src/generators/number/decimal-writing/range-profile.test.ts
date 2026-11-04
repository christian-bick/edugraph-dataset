import {Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import * as random from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {sampleDecimalWritingInRange} from '../decimal-writing-values.ts';
import {DecimalReadingRelationsGenerator} from '../decimal-reading-relations/generator.ts';
import {DecimalReadingRelationsGeneratorSchema, spec as reading} from '../decimal-reading-relations/spec.ts';
import {DecimalWritingGenerator} from './generator.ts';
import {decimalValueRangeChoices, resolveDecimalValueRange} from './range-profile.ts';
import {DecimalWritingGeneratorSchema, spec as writing} from './spec.ts';

afterEach(() => vi.restoreAllMocks());

describe('complete decimal-value range profiles', () => {
    it.each([
        {schema: DecimalWritingGeneratorSchema, spec: writing, instance: new DecimalWritingGenerator()},
        {schema: DecimalReadingRelationsGeneratorSchema, spec: reading, instance: new DecimalReadingRelationsGenerator()}
    ])('realizes exactly two truthful bands through direct and planned $spec.generatorId resolution', ({schema, spec, instance}) => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        expect(spec.generalLabels).toContain(Scope.NumbersWithoutZero);
        expect(spec.generalLabels).not.toContain(Scope.NumbersWithZero);
        for (const rangeLabels of decimalValueRangeChoices) {
            const upper = rangeLabels.some(label => label === Scope.NumbersSmaller5) ? 5 : 10;
            const labels = [Area.DecimalNotation, ...rangeLabels];
            const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
            const view = {viewId: 'range-test', generalLabels: [], schema: {}, spec: {viewId: 'range-test', generalLabels: []}};
            expect(planModelCompatibility({id: 'decimal-band', labels}, model, view).supported).toBe(true);
            expect(planModelCompatibility({id: 'decimal-zero', labels: [...labels, Scope.NumbersWithZero]}, model, view).supported).toBe(false);
            const direct = extractConfig(schema, labels);
            const planned = resolveSchemaChoices(schema, labels, {range: rangeLabels,
                ...('notationFamily' in schema ? {notationFamily: [Area.DecimalNotation]} : {})});
            expect(planned.config).toEqual(direct.config);
            expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
            expect(direct.config.range).toEqual(createCanonicalNumericRange(upper, upper === 5 ? 0 : 5));
            const data = instance.generate(direct.config)!.data;
            const source = data.kind === 'decimal-writing' ? data : data.source;
            const values = [source.valueInThousandths / 1000];
            if (data.kind === 'decimal-reading-relation') values.push(...data.comparisonValues.map(value => value / 1000));
            expect(hasCanonicalRangeWitness(values, direct.config.range!)).toBe(true);
            expect(values.every(value => value > 0)).toBe(true);
        }
    });

    it('rejects incomplete or malformed numerical bands before consuming randomness', () => {
        expect(resolveDecimalValueRange([])).toBeUndefined();
        expect(resolveDecimalValueRange([Scope.NumbersSmaller10])).toBeUndefined();
        expect(() => resolveDecimalValueRange([Scope.NumbersSmaller5, Scope.NumbersSmaller10])).toThrow();
        const draw = vi.spyOn(random, 'random');
        for (const range of [undefined, createCanonicalNumericRange(20), createCanonicalNumericRange(10),
            {...createCanonicalNumericRange(5), maximumAbove: 0}, {...createCanonicalNumericRange(5), minimumBelow: 10}])
            expect(() => sampleDecimalWritingInRange(range as never)).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });

    it.each([DecimalWritingGeneratorSchema, DecimalReadingRelationsGeneratorSchema])(
        'completes an upper10 request with the necessary lower5 while keeping upper5 without a lower', schema => {
            for (let seed = 0; seed < 16; seed++) {
                random.setSeed(seed);
                const high = extractConfig(schema, [Area.DecimalNotation, Scope.NumbersSmaller10]);
                expect(high.config.range).toEqual(createCanonicalNumericRange(10, 5));
                expect(high.resolvedLabels).toEqual(expect.arrayContaining([Scope.NumbersLarger5, Scope.NumbersSmaller10]));
                const low = extractConfig(schema, [Area.DecimalNotation, Scope.NumbersSmaller5]);
                expect(low.config.range).toEqual(createCanonicalNumericRange(5));
                expect(low.resolvedLabels).not.toContain(Scope.NumbersLarger5);
            }
        }
    );
});

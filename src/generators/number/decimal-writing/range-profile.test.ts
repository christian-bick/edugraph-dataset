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
import {resolveDecimalWholeRange} from './range-profile.ts';
import {DecimalWritingGeneratorSchema, spec as writing} from './spec.ts';

afterEach(() => vi.restoreAllMocks());

describe('decimal whole and fractional quantity range profiles', () => {
    it('realizes exactly the three zero/range combinations through direct and planned resolution', () => {
        for (const [schema, spec, instance] of [
            [DecimalWritingGeneratorSchema, writing, new DecimalWritingGenerator()],
            [DecimalReadingRelationsGeneratorSchema, reading, new DecimalReadingRelationsGenerator()]
        ] as const) {
            expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
            for (const zero of [Scope.NumbersWithZero, Scope.NumbersWithoutZero])
                for (const [bound, upper] of [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10]] as const) {
                    const labels = [Area.DecimalNotation, zero, bound];
                    const match = planModelCompatibility({id: 'decimal-band', labels},
                        {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                        {viewId: 'range-test', generalLabels: [], schema: {}, spec: {viewId: 'range-test', generalLabels: []}});
                    if (zero === Scope.NumbersWithZero && upper === 10) {
                        expect(match.supported).toBe(false);
                        expect(() => extractConfig(schema, labels)).toThrow();
                        continue;
                    }
                    expect(match.supported).toBe(true);
                    const direct = extractConfig(schema, labels);
                    const choices = {zeroProfile: [zero], range: [bound],
                        ...('notationFamily' in schema ? {notationFamily: [Area.DecimalNotation]} : {})};
                    const planned = resolveSchemaChoices(schema, labels, choices);
                    expect(planned.config).toEqual(direct.config);
                    expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
                    expect(direct.config.range).toEqual(createCanonicalNumericRange(upper));
                    const data = instance.generate(direct.config)!.data;
                    const source = data.kind === 'decimal-writing' ? data : data.source;
                    const values = [source.wholePart, source.fractionalPart.numerator / source.fractionalPart.denominator,
                        source.valueInThousandths / 1000];
                    if (data.kind === 'decimal-reading-relation') values.push(...data.comparisonValues.map(value => value / 1000));
                    expect(hasCanonicalRangeWitness(values, direct.config.range!)).toBe(true);
                }
        }
    });

    it('requires exact upper choices and rejects malformed numerical bands before consuming randomness', () => {
        expect(resolveDecimalWholeRange([])).toBeUndefined();
        expect(() => resolveDecimalWholeRange([Scope.NumbersSmaller5, Scope.NumbersSmaller10])).toThrow(/Ambiguous/);
        expect(resolveDecimalWholeRange([Scope.NumbersWithZero, Scope.NumbersSmaller10])).toBeUndefined();
        const draw = vi.spyOn(random, 'random');
        for (const range of [undefined, createCanonicalNumericRange(20), createCanonicalNumericRange(10, 5),
            {...createCanonicalNumericRange(5), maximumAbove: 0}, {...createCanonicalNumericRange(5), minimumBelow: 10}])
            expect(() => sampleDecimalWritingInRange(false, range as never)).toThrow();
        expect(() => sampleDecimalWritingInRange(true, createCanonicalNumericRange(10))).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });

    it('filters correlated direct fallbacks before selecting a zero or range profile', () => {
        for (const schema of [DecimalWritingGeneratorSchema, DecimalReadingRelationsGeneratorSchema])
            for (let seed = 0; seed < 64; seed++) {
                random.setSeed(seed);
                const upper10 = extractConfig(schema, [Area.DecimalNotation, Scope.NumbersSmaller10]);
                expect(upper10.config.zeroProfile).toBe('without-zero');
                expect(upper10.resolvedLabels).toContain(Scope.NumbersWithoutZero);
                const zero = extractConfig(schema, [Area.DecimalNotation, Scope.NumbersWithZero]);
                expect(zero.config.range).toEqual(createCanonicalNumericRange(5));
                expect(zero.resolvedLabels).toContain(Scope.NumbersSmaller5);
            }
    });
});

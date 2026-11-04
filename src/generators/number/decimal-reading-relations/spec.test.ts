import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {spec as reading} from '../../../visuals/views/numbers/numbers-decimal-numeral-reading/spec.ts';
import {decimalValueRangeChoices} from '../decimal-writing/range-profile.ts';
import {DecimalReadingRelationsGenerator} from './generator.ts';
import {DecimalReadingRelationsGeneratorSchema as schema, spec} from './spec.ts';

describe('decimal reading mathematical relation capabilities', () => {
    it('keeps the complete positive decimal context invariant without a zero-valued component profile', () => {
        expect(spec.generalLabels).toEqual([Area.DecimalNotation, Scope.ThousandthDecimals,
            Scope.Base10, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]);
        expect(Object.keys(schema)).toEqual(['range']);
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        const result = generateWithLabels(new DecimalReadingRelationsGenerator(), [...spec.generalLabels])!;
        expect(result.data.kind).toBe('decimal-reading-relation');
        expect(result.data.comparisonValues).toHaveLength(3);
        expect(result.data.source.valueInThousandths).toBeGreaterThan(0);
        expect(result.labels).not.toContain(Scope.NumbersWithZero);
    });

    it.each(decimalValueRangeChoices.map(rangeLabels => ({rangeLabels})))('retains reception and replays the complete-value band$rangeLabels', ({rangeLabels}) => {
        const generator = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
        const consumer = {viewId: reading.viewId, generalLabels: reading.generalLabels, schema: {}, spec: reading};
        const labels = [Area.DecimalNotation, Scope.ThousandthDecimals, Scope.Base10,
            Scope.NumbersWithoutNegatives, Scope.ArabicNumerals, Ability.TextualReception, ...rangeLabels];
        const target = {id: 'read-decimal-values', labels};
        const match = planModelCompatibility(target, generator, consumer);
        expect(match.supported).toBe(true);
        expect(planModelCompatibility({...target, labels: [...labels, Scope.NumbersWithZero]}, generator, consumer).supported).toBe(false);
        if (!match.supported) throw new Error('Expected both complete decimal-value bands to match.');
        const direct = extractConfig(schema, target.labels);
        const high = rangeLabels.some(label => label === Scope.NumbersSmaller10);
        expect(direct.config.range).toEqual(createCanonicalNumericRange(high ? 10 : 5, high ? 5 : 0));
        const input = {generator: new DecimalReadingRelationsGenerator(), generatorSpec: spec,
            viewSchema: {}, viewSpec: reading, plan: match.plan,
            sampleKey: 'read-decimal-values#' + spec.generatorId + '#' + reading.viewId + '#train#question#inst:0', seed: 42, attempt: 1};
        const draw = generatePlannedDraw(input);
        expect(draw.labels).toContain(Scope.NumbersWithoutZero);
        expect(draw.labels).not.toContain(Scope.NumbersWithZero);
        expect(draw.stub!.data.source.wholePart < 5).toBe(!high);
        expect(draw.stub!.data.comparisonValues.every((value: number) =>
            value > 0 && Math.floor(value / 1000) === draw.stub!.data.source.wholePart)).toBe(true);
        expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
    });
});

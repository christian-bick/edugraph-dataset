import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {spec as reading} from '../../../visuals/views/numbers/numbers-decimal-numeral-reading/spec.ts';
import {DecimalReadingRelationsGenerator} from './generator.ts';
import {DecimalReadingRelationsGeneratorSchema, spec} from './spec.ts';

describe('decimal reading mathematical relation capabilities', () => {
    it('declares only the existing mathematical context, with no zero-policy choice', () => {
        expect(spec.generalLabels).toEqual([Area.DecimalNotation, Scope.ThousandthDecimals,
            Scope.Base10, Scope.NumbersWithoutNegatives]);
        expect(DecimalReadingRelationsGeneratorSchema).toEqual({});
        const result = generateWithLabels(new DecimalReadingRelationsGenerator(), [...spec.generalLabels])!;
        expect(result.data.kind).toBe('decimal-reading-relation');
        expect(result.data.comparisonValues).toHaveLength(3);
        expect(result.labels).toEqual([]);
    });

    it('retains the receptive target and rejects unsupported zero-specific requests', () => {
        const generator = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
            schema: DecimalReadingRelationsGeneratorSchema, spec};
        const consumer = {viewId: reading.viewId, generalLabels: reading.generalLabels, schema: {}, spec: reading};
        const labels = [Area.DecimalNotation, Scope.ThousandthDecimals, Scope.Base10,
            Scope.NumbersWithoutNegatives, Scope.ArabicNumerals, Ability.TextualReception];
        expect(planModelCompatibility({id: 'read-decimal', labels}, generator, consumer).supported).toBe(true);
        for (const zero of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) {
            expect(planModelCompatibility({id: 'no-zero-policy', labels: [...labels, zero]}, generator, consumer).supported).toBe(false);
        }
    });
});

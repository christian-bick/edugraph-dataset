import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {spec as reading} from '../../../visuals/views/numbers/numbers-decimal-numeral-reading/spec.ts';
import {DecimalReadingRelationsGenerator} from './generator.ts';
import {DecimalReadingRelationsGeneratorSchema, spec} from './spec.ts';

describe('decimal reading mathematical relation capabilities', () => {
    it('keeps the mathematical context invariant and supplies one matching-capable zero choice', () => {
        expect(spec.generalLabels).toEqual([Area.DecimalNotation, Scope.ThousandthDecimals,
            Scope.Base10, Scope.NumbersWithoutNegatives]);
        expect(Object.keys(DecimalReadingRelationsGeneratorSchema)).toEqual(['zeroProfile']);
        expect(findSchemaFallbackContractIssues(DecimalReadingRelationsGeneratorSchema)).toEqual([]);
        const result = generateWithLabels(new DecimalReadingRelationsGenerator(), [...spec.generalLabels])!;
        expect(result.data.kind).toBe('decimal-reading-relation');
        expect(result.data.comparisonValues).toHaveLength(3);
        expect(result.labels).toHaveLength(1);
        expect([Scope.NumbersWithZero, Scope.NumbersWithoutZero]).toContain(result.labels[0]);
    });

    it('retains reception and realizes both zero requests through direct and planned replay', () => {
        const generator = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
            schema: DecimalReadingRelationsGeneratorSchema, spec};
        const consumer = {viewId: reading.viewId, generalLabels: reading.generalLabels, schema: {}, spec: reading};
        const labels = [Area.DecimalNotation, Scope.ThousandthDecimals, Scope.Base10,
            Scope.NumbersWithoutNegatives, Scope.ArabicNumerals, Ability.TextualReception];
        expect(planModelCompatibility({id: 'read-decimal', labels}, generator, consumer).supported).toBe(true);
        expect(planModelCompatibility({id: 'read-decimal', labels: [...labels, Scope.NumbersWithZero, Scope.NumbersWithoutZero]},
            generator, consumer).supported).toBe(false);
        for (const zero of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) {
            const instance = new DecimalReadingRelationsGenerator();
            const target = {id: 'read-decimal-zero', labels: [...labels, zero]};
            const match = planModelCompatibility(target, generator, consumer);
            expect(match.supported).toBe(true);
            if (!match.supported) throw new Error('Expected both reading zero contexts to match.');
            const direct = extractConfig(DecimalReadingRelationsGeneratorSchema, target.labels);
            expect(direct.resolvedLabels).toEqual([zero]);
            expect(direct.config.zeroProfile).toBe(zero === Scope.NumbersWithZero ? 'with-zero' : 'without-zero');
            const input = {generator: instance, generatorSpec: spec, viewSchema: {}, viewSpec: reading, plan: match.plan,
                sampleKey: `read-decimal-zero#${spec.generatorId}#${reading.viewId}#train#question#inst:0`, seed: 42, attempt: 1};
            const draw = generatePlannedDraw(input);
            expect(draw.labels).toContain(zero);
            expect(draw.stub!.data.source.wholePart === 0).toBe(zero === Scope.NumbersWithZero);
            expect(draw.stub!.data.comparisonValues.every((value: number) => Math.floor(value / 1000) === draw.stub!.data.source.wholePart)).toBe(true);
            expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
        }
    });
});

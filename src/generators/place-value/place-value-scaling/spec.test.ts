import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {spec as viewSpec} from '../../../visuals/views/place-value/place-value-scaling/spec.ts';
import {PlaceValueScalingGenerator} from './generator.ts';
import {PlaceValueScalingGeneratorSchema as schema, type PlaceValueScalingGeneratorConfig, spec} from './spec.ts';

const lowerChoices = [[], [Scope.NumbersLarger5], [Scope.NumbersLarger10]];

describe('PlaceValueScalingGenerator spec integration', () => {
    const generator = new PlaceValueScalingGenerator();

    it('declares nonzero assessed quantities independently of passive numeral glyphs', () => {
        expect(spec.generalLabels).toEqual([
            Area.PlaceValue, Area.ProportionalScaling, Area.Multiplication, Area.Division,
            Scope.IntegerNumbers, Scope.Base10, Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero, Scope.NumbersSmaller1000000
        ]);
        expect(Object.keys(schema)).toEqual(['range']);
        expect(schema.range[0]).toEqual([Scope.NumbersLarger5, Scope.NumbersLarger10]);
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        expect(normalizeSchemaChoices(schema, [], 'generator')[0]!.alternatives.map(choice => choice.labels.join('|')).sort())
            .toEqual(lowerChoices.map(choice => choice.join('|')).sort());
    });

    it.each([0, 5, 10])('resolves the complete lower%s profile before generation', lower => {
        const labels = lowerChoices[[0, 5, 10].indexOf(lower)]!;
        const direct = extractConfig(schema, labels);
        const planned = resolveSchemaChoices(schema, labels, {range: labels});
        expect(direct.config).toEqual({range: createCanonicalNumericRange(1000000, lower)});
        expect(planned.config).toEqual(direct.config);
        expect([...direct.resolvedLabels].sort()).toEqual([...planned.resolvedLabels].sort());
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, labels)!;
            const quantities = [stub.data.number, stub.data.leftPlace.value, stub.data.rightPlace.value, stub.data.scaleFactor];
            expect(stub.labels).toEqual(labels);
            expect(Math.min(...quantities)).toBeGreaterThanOrEqual(lower);
            expect(Math.min(...quantities)).toBeLessThan(direct.config.range!.minimumBelow);
            expect(quantities.every(value => value > 0)).toBe(true);
        }
    });

    it('keeps the real Grade4 lineage and all three complete planned choices replayable', () => {
        const target = {id: '4.NBT.A.1-adjacent-place-scaling~a9dfbf88', labels: [
            Area.PlaceValue, Area.ProportionalScaling, Area.Multiplication, Area.Division,
            Scope.Base10, Scope.NumbersSmaller1000000, ...viewSpec.generalLabels
        ]};
        const match = planModelCompatibility(target,
            {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
            {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: {}, spec: viewSpec});
        expect(match.supported).toBe(true);
        if (!match.supported) throw new Error(match.reason);
        const enumeration = enumerateDependencyAuditSelections(match.plan);
        expect(enumeration.status).toBe('complete');
        expect(enumeration.selections).toHaveLength(3);
        const floors = new Set<number>();
        for (const selection of enumeration.selections) {
            const sampleKey = `${target.id}#${spec.generatorId}#${viewSpec.viewId}#train#question#inst:0`;
            const input = {generator, generatorSchema: schema, generatorSpec: spec, viewSchema: {}, viewSpec,
                plan: match.plan, sampleKey, seed: 37, attempt: 1,
                replay: {version: 1 as const, sampleKey, seed: 37, attempt: 1,
                    selection: createGenerationSelectionReceipt(match.plan, selection.choices)}};
            const resolved = resolvePlannedConfigurations(input);
            const config: PlaceValueScalingGeneratorConfig = resolved.generatorConfig;
            const range = config.range;
            if (!range) throw new Error('The planned scaling selection must resolve a numeric range.');
            expect(range).toEqual(createCanonicalNumericRange(1000000, range.min));
            floors.add(range.min);
            expect(resolved.labels).toContain(Scope.NumbersWithoutZero);
            expect(resolved.labels).not.toContain(Scope.NumbersWithZero);
            const draw = generatePlannedDraw(input), continuation = getRandomState();
            expect(draw.stub).not.toBeNull();
            expect(generatePlannedDraw(input)).toEqual(draw);
            expect(getRandomState()).toEqual(continuation);
            expect(Math.min(draw.stub!.data.rightPlace.value, 10)).toBeGreaterThanOrEqual(range.min);
            expect(Math.min(draw.stub!.data.rightPlace.value, 10)).toBeLessThan(range.minimumBelow);
        }
        expect(floors).toEqual(new Set([0, 5, 10]));
    });
});

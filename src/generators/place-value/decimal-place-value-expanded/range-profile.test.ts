import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {getRandomState} from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {spec as viewSpec, NumbersDecimalExpandedFormViewSchema as viewSchema} from '../../../visuals/views/numbers/numbers-decimal-expanded-form/spec.ts';
import {DecimalPlaceValueExpandedGenerator} from './generator.ts';
import {expandedRangePairs, resolveExpandedRange} from './range-profile.ts';
import {DecimalPlaceValueExpandedGeneratorSchema as schema, type DecimalPlaceValueExpandedGeneratorConfig, spec} from './spec.ts';

describe('decimal-place-value-expanded range configurations', () => {
    it.each(expandedRangePairs)('resolves %s identically in direct and planned paths', (bound, upper) => {
        const direct = extractConfig(schema, [bound]), planned = resolveSchemaChoices(schema, [bound], {range: [bound]});
        expect(planned).toEqual(direct);
        expect(direct.config).toEqual({range: createCanonicalNumericRange(upper)});
        const data = new DecimalPlaceValueExpandedGenerator().generate(direct.config)!.data;
        expect(hasCanonicalRangeWitness([data.valueInThousandths / 1000, ...data.sumTerms.flatMap(term => [term.digit, term.unitNumerator / term.unitDenominator, term.contributionInThousandths / 1000])], direct.config.range!)).toBe(true);
    });

    it('retains every broad-source range choice and current receipt replay', () => {
        const target = {id: 'decimal-range', labels: [...spec.generalLabels, ...viewSpec.generalLabels]};
        const match = planModelCompatibility(target,
            {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
            {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: viewSchema, spec: viewSpec});
        expect(match.supported).toBe(true);
        if (!match.supported) throw new Error(match.reason);
        const enumeration = enumerateDependencyAuditSelections(match.plan);
        expect(enumeration.status).toBe('complete');
        expect(enumeration.selections).toHaveLength([5, 10, 20, 100, 120, 1000].length);
        const uppers = new Set<number>();
        for (const selection of enumeration.selections) {
            const sampleKey = `${target.id}#${spec.generatorId}#${viewSpec.viewId}#train#question#inst:0`;
            const input = {generator: new DecimalPlaceValueExpandedGenerator(), generatorSchema: schema,
                generatorSpec: spec, viewSchema, viewSpec, plan: match.plan, sampleKey, seed: 29, attempt: 1,
                replay: {version: 1 as const, sampleKey, seed: 29, attempt: 1,
                    selection: createGenerationSelectionReceipt(match.plan, selection.choices)}};
            const resolved = resolvePlannedConfigurations(input), draw = generatePlannedDraw(input), state = getRandomState();
            const config: DecimalPlaceValueExpandedGeneratorConfig = resolved.generatorConfig;
            const range = config.range;
            if (!range) throw new Error('The planned expanded-decimal selection must resolve a range.');
            expect(range).toEqual(createCanonicalNumericRange(range.max));
            uppers.add(range.max);
            expect(draw.stub).not.toBeNull();
            expect(generatePlannedDraw(input)).toEqual(draw);
            expect(getRandomState()).toBe(state);
        }
        expect(uppers).toEqual(new Set([5, 10, 20, 100, 120, 1000]));
    });

    it('rejects ambiguous bounds and leaves absent bounds to schema fallback', () => {
        expect(resolveExpandedRange([])).toBeUndefined();
        expect(() => resolveExpandedRange(expandedRangePairs.slice(0, 2).map(([label]) => label)))
            .toThrow(/Ambiguous/);
        expect([5, 10, 20, 100, 120, 1000]).toContain(extractConfig(schema, []).config.range!.max);
    });
});

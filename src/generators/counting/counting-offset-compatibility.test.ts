import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {planModelCompatibility, type ViewChoiceModel} from '../../lib/model-compatibility.ts';
import {bindingsForSelection, resolvePlannedConfigurations} from '../../lib/planned-generation.ts';
import {createGenerationSelectionReceipt} from '../../lib/compatibility.ts';
import {extractConfig} from '../../lib/utils.ts';
import {CountingIncDecGeneratorSchema, spec as oneSpec} from './counting-inc-dec/spec.ts';
import {CountingTenOffsetGeneratorSchema, spec as tenSpec} from './counting-ten-offset/spec.ts';
import {CountingHundredOffsetGeneratorSchema, spec as hundredSpec} from './counting-hundred-offset/spec.ts';

const view: ViewChoiceModel = {viewId: 'offset-evidence', generalLabels: [], schema: {},
    spec: {viewId: 'offset-evidence', generalLabels: []}};
const widths = [[[], 'unrestricted', null], [[Scope.TwoDigitLargestOperand], 'two-digit', 2],
    [[Scope.ThreeDigitLargestOperand], 'three-digit', 3]] as const;

describe('offset semantic feasibility', () => {
    it.each([
        {step: 10, schema: CountingTenOffsetGeneratorSchema, spec: tenSpec, widths},
        {step: 100, schema: CountingHundredOffsetGeneratorSchema, spec: hundredSpec, widths: [widths[0], widths[2]]}
    ] as const)('plans exactly the complete finite feasible contexts for step$step', ({step, schema, spec, widths}) => {
        for (const upper of schema.range[0]) {
            const maximum = Number(upper.split('/NumbersSmaller')[1]), range = createCanonicalNumericRange(maximum);
            for (const [profileLabels, , digits] of widths) for (const [directionLabel, direction] of [[Area.Increment, 'inc'], [Area.Decrement, 'dec']] as const)
                for (const [zeroLabel, requireZero] of [[Scope.NumbersWithZero, true], [Scope.NumbersWithoutZero, false]] as const) {
                    const labels = [upper, ...profileLabels, directionLabel, zeroLabel];
                    const expected = Array.from({length: maximum}, (_, index) => index + 1).filter(start => {
                        const result = start + (direction === 'inc' ? step : -step);
                        if (result < 1 || result > maximum || /0/.test(`${start}/${result}`)
                            || digits !== null && (start < step || String(start).length !== digits)
                            || Math.max(start, result) <= range.maximumAbove) return false;
                        const coefficients = [start, result].flatMap(number => maximum > 100
                            ? [Math.floor(number / 100), Math.floor(number % 100 / 10), number % 10]
                            : [Math.floor(number / 10), number % 10]);
                        return coefficients.includes(0) === requireZero;
                    });
                    const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
                    const result = planModelCompatibility({id: 'offset-domain', labels}, model, view);
                    expect(result.supported, labels.join(',')).toBe(expected.length > 0);
                    if (!result.supported) continue;
                    const enumeration = enumerateDependencyAuditSelections(result.plan);
                    expect(enumeration.status).toBe('complete');
                    expect(enumeration.selections).toHaveLength(1);
                    const receipt = createGenerationSelectionReceipt(result.plan, enumeration.selections[0]!.choices);
                    const bindings = bindingsForSelection(result.plan, receipt);
                    expect(bindings.generator).toHaveProperty('requireZero');
                    const resolved = resolvePlannedConfigurations({generatorSchema: schema, viewSchema: {}, plan: result.plan,
                        sampleKey: `offset-domain#${spec.generatorId}#offset-evidence#train#question#inst:0`, seed: 1, attempt: 1,
                        replay: {version: 1, sampleKey: `offset-domain#${spec.generatorId}#offset-evidence#train#question#inst:0`,
                            seed: 1, attempt: 1, selection: receipt}});
                    expect(extractConfig(schema, enumeration.selections[0]!.labels).config).toEqual(resolved.generatorConfig);
                    expect(resolved.generatorConfig).toEqual({direction, operandProfile: digits === null ? 'unrestricted'
                        : digits === 2 ? 'two-digit' : 'three-digit', requireZero, range});
                }
        }
    });
    it.each([
        [CountingTenOffsetGeneratorSchema, tenSpec, Scope.TwoDigitLargestOperand, Scope.NumbersSmaller20],
        [CountingHundredOffsetGeneratorSchema, hundredSpec, Scope.ThreeDigitLargestOperand, Scope.NumbersSmaller120]
    ] as const)('retains only the feasible decrement for a tight profiled zero-involving request', (schema, spec, profile, upper) => {
        const labels = [upper, profile, Scope.NumbersWithZero];
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
        const result = planModelCompatibility({id: 'tight-offset', labels}, model, view);
        expect(result.supported).toBe(true);
        if (!result.supported) throw new Error(result.reason);
        for (const selection of enumerateDependencyAuditSelections(result.plan).selections) {
            const direct = extractConfig(schema, selection.labels).config;
            expect(direct.direction).toBe('dec');
        }
        for (let seed = 0; seed < 32; seed++) expect(extractConfig(schema, labels).config.direction).toBe('dec');
    });
    it('rejects positive global floors for all three mathematical steps', () => {
        for (const lower of [Scope.NumbersLarger5, Scope.NumbersLarger10, Scope.NumbersLarger100])
            for (const [schema, spec] of [[CountingIncDecGeneratorSchema, oneSpec],
                [CountingTenOffsetGeneratorSchema, tenSpec], [CountingHundredOffsetGeneratorSchema, hundredSpec]] as const) {
                const result = planModelCompatibility({id: 'unit1-outside-floor', labels: [
                    lower, Scope.NumbersSmaller1000, Area.Increment]}, {
                    generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec}, view);
                expect(result.supported).toBe(false);
            }
    });
});

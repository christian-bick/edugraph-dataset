import {Area, Scope} from 'edugraph-ts';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {DecimalStandardMultiplicationBody} from '../../../visuals/views/operations/decimal-standard-view.tsx';
import {OperationsDecimalStandardMultiplicationViewSchema, spec as viewSpec} from '../../../visuals/views/operations/operations-decimal-standard-multiplication/spec.ts';
import {StandardAlgorithmDecimalMultiplicationGenerator} from './generator.ts';
import {StandardAlgorithmDecimalMultiplicationGeneratorSchema as schema, spec} from './spec.ts';

describe('standard decimal multiplication range integration', () => {
    it('supports all six pre-generation profiles in direct/planned resolution and both render modes', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        for (const [label, upper] of [[Scope.NumbersSmaller100, 100], [Scope.NumbersSmaller120, 120], [Scope.NumbersSmaller1000, 1000],
            [Scope.NumbersSmaller10000, 10000], [Scope.NumbersSmaller100000, 100000], [Scope.NumbersSmaller1000000, 1000000]] as const) {
            const labels = [...spec.generalLabels, ...viewSpec.generalLabels, label];
            const plan = planModelCompatibility({id: 'standard-decimal-product-band', labels},
                {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: OperationsDecimalStandardMultiplicationViewSchema, spec: viewSpec});
            expect(plan.supported).toBe(true);
            const direct = extractConfig(schema, labels), planned = resolveSchemaChoices(schema, labels, {range: [label]});
            expect(planned.config).toEqual(direct.config);
            expect(planned.resolvedLabels).toEqual(direct.resolvedLabels);
            expect(direct.config.range).toEqual(createCanonicalNumericRange(upper));
            const data = new StandardAlgorithmDecimalMultiplicationGenerator().generate(direct.config).data;
            expect(hasCanonicalRangeWitness([data.multiplicand.coefficient, data.multiplier.coefficient,
                data.unscaledProduct, data.partialRows[0]!.shiftPlaces], direct.config.range!)).toBe(true);
            const question = renderToStaticMarkup(createElement(DecimalStandardMultiplicationBody, {data, isSolutionView: false}));
            const solution = renderToStaticMarkup(createElement(DecimalStandardMultiplicationBody, {data, isSolutionView: true}));
            expect(question).toContain('coefficient-column multiplication');
            expect(question).toContain(data.multiplicand.numeral);
            expect(question).toContain(data.multiplier.numeral);
            expect(solution).toContain('Unscaled product');
            expect(solution).toContain('shift 0');
        }
    });

    it('retains the elementary integer-domain positive matching boundary', () => {
        const plan = planModelCompatibility({id: 'whole-numbers', labels: [Area.MultiplicationStandardAlgorithm, Scope.IntegerNumbers, Scope.NumbersSmaller1000]},
            {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
            {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: OperationsDecimalStandardMultiplicationViewSchema, spec: viewSpec});
        expect(plan.supported).toBe(false);
    });
});

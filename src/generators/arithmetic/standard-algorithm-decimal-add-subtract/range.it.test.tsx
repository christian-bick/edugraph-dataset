import {Area, Scope} from 'edugraph-ts';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {DecimalStandardAddSubtractBody} from '../../../visuals/views/operations/decimal-standard-view.tsx';
import {OperationsDecimalStandardAddSubtractViewSchema, spec as viewSpec} from '../../../visuals/views/operations/operations-decimal-standard-add-subtract/spec.ts';
import {StandardAlgorithmDecimalAddSubtractGenerator} from './generator.ts';
import {StandardAlgorithmDecimalAddSubtractGeneratorSchema as schema, spec} from './spec.ts';

describe('standard decimal add/subtract range integration', () => {
    const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
    const view = {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: OperationsDecimalStandardAddSubtractViewSchema, spec: viewSpec};

    it('resolves all26 feasible profiles identically through direct/planned paths and preserves Q/S column contracts', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        let profiles = 0;
        for (const [operation, value] of [[Area.AdditionStandardAlgorithm, 'addition'], [Area.SubtractionStandardAlgorithm, 'subtraction']] as const)
            for (const zero of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) for (const upper of [10, 20, 100, 120, 1000, 10000, 100000]) {
                if (zero === Scope.NumbersWithoutZero && upper === 10) continue;
                const range = `http://edugraph.io/edu/NumbersSmaller${upper}`;
                const labels = [...spec.generalLabels, ...viewSpec.generalLabels, operation, zero, range];
                expect(planModelCompatibility({id: 'decimal-column-profile', labels}, model, view).supported).toBe(true);
                const direct = extractConfig(schema, labels), planned = resolveSchemaChoices(schema, labels,
                    {operation: [operation], zeroPresence: [zero], range: [range]});
                expect(planned.config).toEqual(direct.config);
                expect([...planned.resolvedLabels].sort()).toEqual([...direct.resolvedLabels].sort());
                expect(direct.config).toEqual({operation: value, zeroPresence: zero === Scope.NumbersWithZero, range: createCanonicalNumericRange(upper)});
                const data = new StandardAlgorithmDecimalAddSubtractGenerator().generate(direct.config).data;
                const question = renderToStaticMarkup(createElement(DecimalStandardAddSubtractBody, {data, isSolutionView: false}));
                const solution = renderToStaticMarkup(createElement(DecimalStandardAddSubtractBody, {data, isSolutionView: true}));
                expect(question).toContain(data.top.numeral);
                expect(question).toContain(data.bottom.numeral);
                expect(question).toContain('counts of place-value units');
                expect(solution).toContain('Column arithmetic in place units');
                expect(solution).toContain('aligned-top-units');
                expect(solution).toContain('decimal-result');
                profiles++;
            }
        expect(profiles).toBe(26);
    });

    it('excludes infeasible nonzeroU10 and elementary integer-domain targets through ordinary matching', () => {
        expect(planModelCompatibility({id: 'nonzero-ten', labels: [Area.AdditionStandardAlgorithm, Scope.NumbersWithoutZero, Scope.NumbersSmaller10]}, model, view).supported).toBe(false);
        expect(planModelCompatibility({id: 'integer', labels: [Area.AdditionStandardAlgorithm, Scope.IntegerNumbers]}, model, view).supported).toBe(false);
    });
});

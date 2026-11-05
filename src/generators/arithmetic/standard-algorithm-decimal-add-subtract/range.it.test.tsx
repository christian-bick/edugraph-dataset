import {Area, Scope} from 'edugraph-ts';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, describe, expect, it} from 'vitest';
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

    const profileContexts = ([[Area.AdditionStandardAlgorithm, 'addition'], [Area.SubtractionStandardAlgorithm, 'subtraction']] as const)
        .flatMap(([operation, value]) => [Scope.NumbersWithZero, Scope.NumbersWithoutZero].flatMap(zero =>
            [10, 20, 100, 120, 1000, 10000, 100000].filter(upper => zero !== Scope.NumbersWithoutZero || upper !== 10)
                .map(upper => ({operation, value, zero, upper}))));
    const observedProfiles: string[] = [];

    it('retains the complete schema fallback contract', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
    });

    it.each(profileContexts)('resolves $value / $zero / upper$upper through direct/planned paths and actual Q/S rendering', ({operation, value, zero, upper}) => {
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
        observedProfiles.push(`${operation}/${zero}/${upper}`);
    });

    afterAll(() => {
        expect(profileContexts).toHaveLength(26);
        expect(observedProfiles).toEqual(profileContexts.map(({operation, zero, upper}) => `${operation}/${zero}/${upper}`));
    });

    it('excludes infeasible nonzeroU10 and elementary integer-domain targets through ordinary matching', () => {
        expect(planModelCompatibility({id: 'nonzero-ten', labels: [Area.AdditionStandardAlgorithm, Scope.NumbersWithoutZero, Scope.NumbersSmaller10]}, model, view).supported).toBe(false);
        expect(planModelCompatibility({id: 'integer', labels: [Area.AdditionStandardAlgorithm, Scope.IntegerNumbers]}, model, view).supported).toBe(false);
    });
});

import {Area, Scope} from 'edugraph-ts';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {DecimalStandardDivisionBody} from '../../../visuals/views/operations/decimal-standard-view.tsx';
import {OperationsDecimalStandardDivisionViewSchema, spec as viewSpec} from '../../../visuals/views/operations/operations-decimal-standard-division/spec.ts';
import {StandardAlgorithmDecimalDivisionGenerator} from './generator.ts';
import {StandardAlgorithmDecimalDivisionGeneratorSchema as schema, spec} from './spec.ts';

describe('standard decimal division range integration', () => {
    it('supports eight pre-generation bands through both resolution paths, native replay and Q/S projection', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        for (const upper of [10, 20, 100, 120, 1000, 10000, 100000, 1000000]) {
            const label = `http://edugraph.io/edu/NumbersSmaller${upper}`;
            const labels = [...spec.generalLabels, ...viewSpec.generalLabels, label];
            const plan = planModelCompatibility({id: 'decimal-division-band', labels},
                {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: OperationsDecimalStandardDivisionViewSchema, spec: viewSpec});
            expect(plan.supported).toBe(true);
            const direct = extractConfig(schema, labels), planned = resolveSchemaChoices(schema, labels, {range: [label]});
            expect(planned.config).toEqual(direct.config);
            expect(planned.resolvedLabels).toEqual(direct.resolvedLabels);
            expect(direct.config.range).toEqual(createCanonicalNumericRange(upper));
            const generator = new StandardAlgorithmDecimalDivisionGenerator();
            setSeed(upper);
            const result = generator.generate(direct.config), state = getRandomState();
            setSeed(upper);
            expect(generator.generate(planned.config)).toEqual(result);
            expect(getRandomState()).toBe(state);
            const question = renderToStaticMarkup(createElement(DecimalStandardDivisionBody, {data: result.data, isSolutionView: false}));
            const solution = renderToStaticMarkup(createElement(DecimalStandardDivisionBody, {data: result.data, isSolutionView: true}));
            expect(question).toContain(result.data.dividend.numeral);
            expect(question).toContain(result.data.divisor.numeral);
            expect(solution).toContain('exact-remainder');
            expect(solution).toContain('normalization-dividend');
        }
    });

    it('retains the ordinary integer-domain matching exclusion', () => {
        expect(planModelCompatibility({id: 'integer-division', labels: [Area.DivisionStandardAlgorithm, Scope.IntegerNumbers]},
            {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
            {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: OperationsDecimalStandardDivisionViewSchema, spec: viewSpec}).supported).toBe(false);
    });
});

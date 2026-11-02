import {Area, Scope} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {FractionArithmeticView} from '../../../visuals/views/fractions/fraction-arithmetic-view.tsx';
import {presentFractionArithmeticProblem} from '../../../visuals/views/fractions/fraction-arithmetic-presentation.ts';
import {FractionArithmeticGenerator} from './generator.ts';
import {fractionArithmeticUpperBounds} from './numeric-domain.ts';
import {FractionArithmeticGeneratorSchema as schema, spec} from './spec.ts';

const requests = [
    [Area.Addition, Scope.FractionNumbers, Scope.ProperFractions, Scope.CommonDenominator],
    [Area.Subtraction, Scope.FractionNumbers, Scope.ProperFractions, Scope.CommonDenominator],
    [Area.Addition, Scope.ProperFractions, Scope.CommonDenominator],
    [Area.Addition, Scope.ImproperFractions, Scope.MixedNumbers, Scope.CommonDenominator],
    [Area.Addition, Scope.MixedNumbers, Scope.ProperFractions, Scope.CommonDenominator],
    [Area.Subtraction, Scope.MixedNumbers, Scope.ProperFractions, Scope.CommonDenominator],
    [Area.Multiplication, Area.IteratedOperation, Scope.IntegerNumbers, Scope.UnitFractions],
    [Area.Multiplication, Area.IteratedOperation, Scope.IntegerNumbers, Scope.ProperFractions],
    [Area.Multiplication, Area.IteratedOperation, Scope.IntegerNumbers, Scope.ImproperFractions],
    [Area.Addition, Area.Multiplication, Scope.TenthFractions, Scope.ProperFractions, Scope.CommonDenominator]
];
const rangePairs = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100]] as const;

describe('fraction arithmetic range integration', () => {
    it('resolves all24 settled task/operation ranges directly and through plans, with deterministic replay', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        const generator = new FractionArithmeticGenerator();
        let combinations = 0;
        for (const request of requests) for (const [label, upper] of rangePairs) {
            const preliminary = extractConfig(schema, request);
            const labels = [...request, label];
            const plan = planModelCompatibility({id: 'fraction-band', labels},
                {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                {viewId: 'range-proof', generalLabels: [], schema: {}, spec: {viewId: 'range-proof', generalLabels: []}});
            if (!fractionArithmeticUpperBounds(preliminary.config.task!).includes(upper)) {
                expect(plan.supported).toBe(false);
                expect(() => extractConfig(schema, labels)).toThrow();
                continue;
            }
            expect(plan.supported).toBe(true); combinations++;
            const direct = extractConfig(schema, labels);
            const planned = resolveSchemaChoices(schema, labels, {
                task: request.filter(value => schema.task[0].includes(value as never)),
                operation: request.filter(value => schema.operation[0].includes(value as never)),
                usesCommonDenominator: request.includes(Scope.CommonDenominator) ? [Scope.CommonDenominator] : [], range: [label]
            });
            expect(planned.config).toEqual(direct.config);
            expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
            expect(direct.config.range).toEqual(createCanonicalNumericRange(upper));
            setSeed(`fraction-band:${direct.config.task}:${upper}`);
            const first = generator.generate(direct.config), state = getRandomState();
            setSeed(`fraction-band:${direct.config.task}:${upper}`);
            expect(generator.generate(planned.config)).toEqual(first);
            expect(getRandomState()).toBe(state);
            for (const presentation of ['interpretation', 'understanding', 'execution-model', 'execution-word'] as const) {
                if (!presentFractionArithmeticProblem(first.data, presentation)) continue;
                for (const isSolutionView of [false, true]) expect(() => renderToStaticMarkup(<FractionArithmeticView
                    layout={presentation === 'execution-word' ? 'word' : 'model'} viewId="range-proof" presentation={presentation}
                    payload={{problem: {type: 'fraction', data: first.data, labels: []}, viewId: 'range-proof',
                        targetLabels: [], isSolutionView, seed: 1}} />)).not.toThrow();
            }
        }
        expect(combinations).toBe(24);
    });

    it('completes unlike-denominator selections with a reviewed common-part range', () => {
        for (const numberKind of [Scope.FractionNumbers, Scope.MixedNumbers]) for (const operation of [Area.Addition, Area.Subtraction]) {
            const labels = [operation, numberKind, Scope.UnlikeDenominators, Scope.ProperFractions];
            const direct = extractConfig(schema, labels);
            expect(direct.resolvedLabels.some(label => rangePairs.some(([bound]) => label === bound))).toBe(true);
            expect(new FractionArithmeticGenerator().generate(direct.config).data.task.startsWith('unlike-')).toBe(true);
            for (const [bound, upper] of rangePairs) {
                if (fractionArithmeticUpperBounds(direct.config.task!, operation === Area.Addition ? 'addition' : 'subtraction').includes(upper))
                    expect(extractConfig(schema, [...labels, bound]).config.range).toEqual(createCanonicalNumericRange(upper));
                else expect(() => extractConfig(schema, [...labels, bound])).toThrow();
            }
        }
    });
});

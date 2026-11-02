import {renderToStaticMarkup} from 'react-dom/server';
import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {PatternTableView} from '../../../visuals/views/operations/pattern-table-view.tsx';
import {OperationsPatternTableViewSchema, spec as viewSpec} from '../../../visuals/views/operations/operations-pattern-table/spec.ts';
import {operationTableProblem, operationTableQuantities} from './domain.ts';
import {ArithmeticOperationTableGenerator} from './generator.ts';
import {spec} from './spec.ts';

const generator = new ArithmeticOperationTableGenerator();
const plan = (labels: string[]) => planModelCompatibility({id: 'canonical-operation-table', labels},
    {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema: generator.schema, spec},
    {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: OperationsPatternTableViewSchema, spec: viewSpec});

describe('operation-table canonical row projections', () => {
    it('retains all four exact cells in the actual view plan with deterministic replay', () => {
        let cells = 0;
        for (const operation of [Area.Addition, Area.Multiplication]) {
            for (const upper of [Scope.NumbersSmaller10, Scope.NumbersSmaller20, Scope.NumbersSmaller100]) {
                const labels = [operation, upper, Area.GenerativeRuleRecognition, Ability.ConceptClassification];
                const result = plan(labels);
                if ((operation === Area.Addition && upper === Scope.NumbersSmaller100)
                    || (operation === Area.Multiplication && upper === Scope.NumbersSmaller10)) {
                    expect(result.supported).toBe(false);
                    continue;
                }
                expect(result.supported).toBe(true);
                if (!result.supported) continue;
                for (const seed of [0, 17, 77]) {
                    const input = {generator, generatorSpec: spec, viewSpec, viewSchema: OperationsPatternTableViewSchema,
                        plan: result.plan, sampleKey: `canonical-operation-table#${spec.generatorId}#${viewSpec.viewId}#train#question#inst:0`, seed, attempt: 1};
                    const first = generatePlannedDraw(input);
                    expect(generatePlannedDraw({...input, replay: first.replay})).toEqual(first);
                    expect(first.view.config).toEqual({});
                    expect(hasCanonicalRangeWitness(operationTableQuantities(first.stub!.data), resolveCanonicalRangeFromLabels(first.labels)!)).toBe(true);
                    expect(first.labels).toContain(Scope.NumbersWithZero);
                }
                cells++;
            }
        }
        expect(cells).toBe(4);
    });

    it('renders the same mathematical row and classification in both modes for every original frame', () => {
        let projections = 0;
        for (const operation of ['addition', 'multiplication'] as const) {
            for (const row of [2, 3, 4, 5]) {
                const data = operationTableProblem(operation, row);
                const upper = operation === 'addition' ? row < 5 ? 10 : 20 : row < 4 ? 20 : 100;
                expect(hasCanonicalRangeWitness(operationTableQuantities(data), createCanonicalNumericRange(upper))).toBe(true);
                for (const isSolutionView of [false, true]) {
                    const render = (labels: string[]) => renderToStaticMarkup(<PatternTableView
                        mode="legacy-classification" viewId={viewSpec.viewId} payload={{
                            problem: {type: 'arithmetic', data, labels}, viewId: viewSpec.viewId,
                            targetLabels: [], seed: 13, isSolutionView
                        }} />);
                    const markup = render([]);
                    expect(markup).toBe(render([Scope.NumbersWithZero]));
                    expect(markup).toContain(`Increase by ${data.rowRelation.difference}`);
                    expect(markup).toContain('classifies the highlighted row');
                    expect(markup.split('bg-amber-100 font-bold text-amber-900')).toHaveLength(8);
                    expect(markup.includes('border-emerald-600')).toBe(isSolutionView);
                    projections++;
                }
            }
        }
        expect(projections).toBe(16);
    });
});

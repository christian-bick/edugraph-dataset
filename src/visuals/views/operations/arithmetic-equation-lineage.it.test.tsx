import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {spec as gradeOne} from '../../../spec/ccss/grade-01.ts';
import {spec as gradeTwo} from '../../../spec/ccss/grade-02.ts';
import {spec as gradeThree} from '../../../spec/ccss/grade-03.ts';
import {ArithmeticOpsPairsGenerator} from '../../../generators/arithmetic/arithmetic-ops-pairs/generator.ts';
import {spec as pairSpec} from '../../../generators/arithmetic/arithmetic-ops-pairs/spec.ts';
import {ArithmeticOpsTriplesGenerator} from '../../../generators/arithmetic/arithmetic-ops-triples/generator.ts';
import {spec as tripleSpec} from '../../../generators/arithmetic/arithmetic-ops-triples/spec.ts';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {matchTarget} from '../../../lib/matching.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {getRandomState, setRandomState, setSeed} from '../../../lib/random.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {extractSchemaLabels} from '../../../types/schema.ts';
import type {ArithmeticPairProblem} from '../../../types/problems.ts';
import {ArithmeticBoxesView} from './arithmetic-boxes-view.tsx';
import {ArithmeticVerticalView} from './arithmetic-vertical-view.tsx';
import {EqualAddendsEquation} from './equal-addends-equation-view.tsx';
import {OperationsBoxesViewSchema as boxesSchema, spec as boxesSpec} from './operations-boxes/spec.ts';
import {OperationsVerticalViewSchema as verticalSchema, spec as verticalSpec} from './operations-vertical/spec.ts';
import {OperationsEqualAddendsEquationViewSchema as writerSchema, spec as writerSpec} from './operations-equal-addends-equation/spec.ts';

const lawCases = [
    ['1.OA.B.3-properties~e7e3e1aa', 1], ['1.OA.B.3-properties~5b12ee6e', 1],
    ['1.OA.B.3-properties~9b3ced17', 2], ['1.OA.B.3-properties~e5c58f55', 1],
    ['1.OA.B.3-properties~4c527f0f', 1], ['1.OA.B.3-properties~dca16be6', 2],
    ['3.OA.B.5-distributive-property~cce6e402', 1], ['3.OA.B.5-distributive-property~c116f732', 1],
    ['3.OA.B.5-distributive-property~92dec539', 1], ['3.OA.B.5-distributive-property~bcbf8b0e', 2]
] as const;
const writerCases = [['2.OA.C.3-even-equal-addends~88f610cb', 2],
    ['2.OA.C.3-even-equal-addends~a15286b6', 2], ['2.OA.C.3-even-equal-addends~b9f35014', 1]] as const;
const targets = [...gradeOne, ...gradeTwo, ...gradeThree];
const pairs = new ArithmeticOpsPairsGenerator(), triples = new ArithmeticOpsTriplesGenerator();

describe('real equation task lineage and replay', () => {
    it('covers exactly the reviewed twenty law routes and five unique writer bindings', () => {
        expect(lawCases).toHaveLength(10);
        expect(lawCases.reduce((sum, [, count]) => sum + count, 0) * 2).toBe(26);
        expect(writerCases.reduce((sum, [, count]) => sum + count, 0)).toBe(5);
    });

    it.each([...lawCases, ...writerCases])('replays every current binding for %s', (targetId, count) => {
        const target = targets.find(target => target.id === targetId)!;
        expect(target).toBeDefined();
        const writer = targetId.startsWith('2.OA.C.3');
        const generator = writer ? pairs : triples;
        const generatorSpec = writer ? pairSpec : tripleSpec;
        const generatorModel = {generatorId: generatorSpec.generatorId, generalLabels: generatorSpec.generalLabels,
            labels: [...generatorSpec.generalLabels, ...extractSchemaLabels(generator.schema)],
            schema: generator.schema, spec: generatorSpec, problemType: writer ? 'ArithmeticPairProblem' : 'ArithmeticTripleProblem'};
        const consumers = writer ? [[writerSpec, writerSchema] as const]
            : [[boxesSpec, boxesSchema] as const, [verticalSpec, verticalSchema] as const];
        for (const [viewSpec, viewSchema] of consumers) {
            const match = matchTarget(target, generatorModel, {viewId: viewSpec.viewId,
                generalLabels: viewSpec.generalLabels, supportedLabels: [...viewSpec.generalLabels, ...extractSchemaLabels(viewSchema)],
                schema: viewSchema, spec: viewSpec, problemType: writer ? 'ArithmeticPairProblem' : 'ArithmeticProblem'});
            expect(match.matched).toBe(true);
            if (!match.matched) throw new Error(match.reason);
            const enumeration = enumerateDependencyAuditSelections(match.plan);
            expect(enumeration.status).toBe('complete');
            expect(enumeration.selections).toHaveLength(count);
            for (const selection of enumeration.selections) {
                const receipt = createGenerationSelectionReceipt(match.plan, selection.choices);
                for (let seed = 0; seed < 4; seed++) {
                    const sampleKey = `${targetId}#${generatorSpec.generatorId}#${viewSpec.viewId}#train#question#${seed}`;
                    const input = {generator, generatorSpec, viewSpec, viewSchema, plan: match.plan,
                        sampleKey, seed, attempt: 1, replay: {version: 1 as const, sampleKey, seed, attempt: 1, selection: receipt}};
                    const draw = generatePlannedDraw(input), continuation = getRandomState();
                    expect(draw.stub).not.toBeNull();
                    expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
                    expect(getRandomState()).toBe(continuation);
                    const resolved = resolvePlannedConfigurations({...input, generatorSchema: generator.schema});
                    if (writer) {
                        setSeed(seed);
                        expect(pairSpec.inferredLabels).toBeUndefined();
                        const direct = extractConfig(pairs.schema, resolved.generatorLabels,
                            {spec: {...pairSpec, inferredLabels: undefined}, owner: 'generator'});
                        expect(direct.config).toEqual(resolved.generatorConfig);
                        expect(getRandomState()).toBe(resolved.generatorRandomState);
                    }
                    // A full configuration is the generator's direct API. Flattening role labels
                    // loses field provenance for the legacy shared smallest-operand alias.
                    setRandomState(resolved.generatorRandomState);
                    const direct = generator.generate(resolved.generatorConfig as never);
                    expect(direct?.data).toEqual(draw.stub!.data);
                    expect(getRandomState()).toBe(continuation);
                    expect(draw.labels).toContain(Area.Equation);
                    expect(draw.labels).not.toContain(writer ? Ability.ProcedureExecution : Ability.Formalization);
                    const data = draw.stub!.data;
                    for (const isSolutionView of [false, true]) {
                        let markup: string;
                        if (writer) {
                            markup = renderToStaticMarkup(<EqualAddendsEquation data={data as ArithmeticPairProblem} isSolutionView={isSolutionView} />);
                            expect(markup.includes('aria-label="Write your equation"')).toBe(!isSolutionView);
                            expect(markup.includes(`${data.num1} + ${data.num2} = ${data.answer}`)).toBe(isSolutionView);
                        } else {
                            const payload = {viewId: viewSpec.viewId, problem: {type: 'arithmetic', data, labels: draw.labels},
                                seed, isSolutionView, targetLabels: target.labels, preparedView: draw.view};
                            markup = viewSpec.viewId === boxesSpec.viewId
                                ? renderToStaticMarkup(<ArithmeticBoxesView invertProcedure={false}
                                    equationShape={resolved.view.config.equationShape as never} payload={payload as never} />)
                                : renderToStaticMarkup(<ArithmeticVerticalView invertProcedure={false}
                                    presentation={resolved.view.config.presentation as never} payload={payload as never} />);
                            const both = data.propertyLaw === 'distributive';
                            expect(draw.labels).toContain(both ? Scope.ExpressionOnBothSides : Scope.ExpressionOnOneSide);
                            expect(draw.labels).not.toContain(both ? Scope.ExpressionOnOneSide : Scope.ExpressionOnBothSides);
                            expect(markup).toContain('Use the property relationship to find the missing value.');
                            expect(markup.includes('The missing value is')).toBe(isSolutionView);
                        }
                        expect(markup).not.toMatch(/NaN|undefined|Rendering Error/);
                    }
                }
            }
        }
    });
});

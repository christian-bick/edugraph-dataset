import {renderToStaticMarkup} from 'react-dom/server';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {ArithmeticWordProblemWithin100View} from '../../../visuals/views/operations/arithmetic-word-problem-within-100-view.tsx';
import {OperationsWordProblemEquationFormalizationViewSchema as viewSchema, spec as viewSpec} from '../../../visuals/views/operations/operations-word-problem-equation-formalization/spec.ts';
import {operationNames} from '../helpers.ts';
import {ArithmeticWordProblemsLetterEquationGenerator} from './generator.ts';
import {letterEquationDomain, letterEquationFormulas, letterEquationFrame, letterEquationQuantities} from './domain.ts';
import {ArithmeticWordProblemsLetterEquationGeneratorSchema as schema, spec} from './spec.ts';

const profiles = letterEquationFormulas.slice(0, 10).flatMap(formula => canonicalRangeProfiles
    .filter(({range}) => [0, 5, 10, 20].includes(range.min) && letterEquationDomain(formula.operations, range).count > 0)
    .map(profile => ({...profile, operations: formula.operations, labels: [...profile.labels,
        ...new Set(formula.operations.map(operation => Object.keys(operationNames).find(label => operationNames[label as keyof typeof operationNames] === operation)!))]})));

describe('letter-equation canonical range integration', () => {
    it('resolves all 238 native and inherited positive-floor cells directly and through actual-view plans with replay', () => {
        const generator = new ArithmeticWordProblemsLetterEquationGenerator();
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        expect(profiles).toHaveLength(238);
        for (const profile of profiles) {
            const labels = [Ability.Formalization, Scope.IntegerNumbers, ...profile.labels];
            const result = planModelCompatibility({id: 'scalar-equation', labels},
                {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: viewSchema, spec: viewSpec});
            expect(result.supported).toBe(true);
            if (!result.supported) continue;
            setSeed(17);
            const direct = extractConfig(schema, labels);
            const data = generator.generate(direct.config)!.data;
            expect(data.operations).toEqual(profile.operations);
            expect(hasCanonicalRangeWitness(letterEquationQuantities(data), profile.range)).toBe(true);
            const input = {generator, generatorSpec: spec, viewSchema, viewSpec, plan: result.plan,
                sampleKey: `scalar-equation#${spec.generatorId}#${viewSpec.viewId}#train#question#inst:0`, seed: 17, attempt: 1};
            const draw = generatePlannedDraw(input);
            expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
        }
    });

    it('retains Question/Solution rendering for the smallest and largest scalar frames of all cells', () => {
        let rendered = 0;
        for (const profile of profiles) {
            const domain = letterEquationDomain(profile.operations, profile.range);
            for (const index of [0, domain.count - 1]) {
                const data = letterEquationFrame(domain, profile.operations, index);
                for (const isSolutionView of [false, true]) {
                    const render = (labels: string[]) => renderToStaticMarkup(<ArithmeticWordProblemWithin100View
                        config={{expectedKind: 'letter-equation', invertProcedure: false, useLengthContext: false}}
                        payload={{problem: {type: 'arithmetic', data, labels}, targetLabels: [],
                            viewId: 'operations-word-problem-equation-formalization', seed: 13, isSolutionView} as never} />);
                    expect(render(profile.labels)).toBe(render([]));
                    rendered++;
                }
            }
        }
        expect(rendered).toBe(952);
    });
});

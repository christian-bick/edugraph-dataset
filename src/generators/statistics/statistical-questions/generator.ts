import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {StatisticalColor, StatisticalObservationOccasion, StatisticalObservationUnit,
    StatisticalQuestionsProblem} from '../../../types/problems.ts';
import {buildStatisticalQuestionsProblem, type StatisticalInvestigationInput} from '../statistical-question-helpers.ts';
import {StatisticalQuestionsGeneratorSchema, type StatisticalQuestionsGeneratorConfig} from './spec.ts';

const generatorId = 'statistical-questions';
const colors = ['red', 'blue', 'green', 'yellow'] as const;
const unitNames = {person: 'Person', die: 'Die', triangle: 'Triangle', rectangle: 'Rectangle',
    'sealed-pencil-box': 'Box'} as const;
const units = (kind: StatisticalObservationUnit['kind'], count: number): [StatisticalObservationUnit, ...StatisticalObservationUnit[]] => [
    {id: 'unit-1', name: `${unitNames[kind]} 1`, kind},
    ...Array.from({length: count - 1}, (_, index) => ({id: `unit-${index + 2}`, name: `${unitNames[kind]} ${index + 2}`, kind}))
];
const occasions = (name: string, count: number): [StatisticalObservationOccasion, ...StatisticalObservationOccasion[]] => [
    {id: 'occasion-1', name: `${name} 1`},
    ...Array.from({length: count - 1}, (_, index) => ({id: `occasion-${index + 2}`, name: `${name} ${index + 2}`}))
];

export class StatisticalQuestionsGenerator implements ProblemGenerator<StatisticalQuestionsProblem, StatisticalQuestionsGeneratorConfig> {
    type: AbstractProblem['type'] = 'statistics';
    schema = StatisticalQuestionsGeneratorSchema;

    generate(config: StatisticalQuestionsGeneratorConfig): ProblemStub<StatisticalQuestionsProblem> {
        validateConfigFields(generatorId, config, ['anticipatedVariation']);
        if (config.anticipatedVariation !== 'present' && config.anticipatedVariation !== 'absent') {
            throw new GeneratorValidationError(generatorId, 'Choose whether anticipated response variation is present or absent.');
        }
        // Entropy changes source observations, complete response domains or constant
        // rules. Card order and the learner's requested classification remain view-owned.
        const selection = Math.floor(random() * 720);
        const colorChoice = selection % 2 === 1, repeated = Math.floor(selection / 2) % 2 === 1;
        const count = 2 + Math.floor(selection / 4) % 5;
        const alternatives = colors.slice(0, 2 + Math.floor(selection / 20) % 3) as [StatisticalColor, StatisticalColor, ...StatisticalColor[]];
        const attribute = colorChoice ? {kind: 'color-choice' as const, alternatives}
            : {kind: 'upper-face-number' as const, die: 'standard-six-sided' as const};
        const variable: StatisticalInvestigationInput = {id: 'investigation-1',
            populationName: colorChoice ? 'the planned color selections' : 'the planned die outcomes',
            units: units(colorChoice ? 'person' : 'die', repeated ? 1 : count),
            occasions: occasions(colorChoice ? 'selection' : 'roll', repeated ? count : 1), attribute};
        const single: StatisticalInvestigationInput = {id: 'investigation-2',
            populationName: colorChoice ? 'the specified color selection' : 'the specified die outcome',
            units: units(colorChoice ? 'person' : 'die', 1), occasions: occasions(colorChoice ? 'selection' : 'roll', 1), attribute};
        const constantFamily = Math.floor(selection / 60) % 3, constantCount = 2 + Math.floor(selection / 180) % 4;
        const shape = constantFamily === 0 ? 'triangle' : 'rectangle';
        const constant: StatisticalInvestigationInput = constantFamily === 2
            ? {id: 'investigation-3', populationName: 'the sealed pencil boxes',
                units: units('sealed-pencil-box', constantCount), occasions: occasions('inspection', 1),
                attribute: {kind: 'sealed-pencil-count', pencilsPerBox: 1 + selection % 20}}
            : {id: 'investigation-3', populationName: `the ${shape}s`, units: units(shape, constantCount),
                occasions: occasions('inspection', 1), attribute: {kind: 'side-count', shape}};
        return {data: buildStatisticalQuestionsProblem(config.anticipatedVariation === 'present'
            ? [variable, single, constant] : [single, constant])};
    }
}

export default new StatisticalQuestionsGenerator();

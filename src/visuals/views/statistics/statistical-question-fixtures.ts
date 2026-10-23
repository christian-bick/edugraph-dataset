import type {StatisticalInvestigation, StatisticalQuestionsProblem} from '../../../types/problems.ts';

/** Literal evidence is independent of the producer's certificate selection. */
export const literalRepeatedDieInvestigation: StatisticalInvestigation = {
    id: 'literal-repeated-die',
    observationPlan: {
        populationName: 'One die across three trials',
        units: [{id: 'die-a', name: 'Die A', kind: 'die'}],
        occasions: [{id: 'trial-a', name: 'Trial A'}, {id: 'trial-b', name: 'Trial B'}, {id: 'trial-c', name: 'Trial C'}],
        indices: [{id: 'roll-a', unitId: 'die-a', occasionId: 'trial-a'}, {id: 'roll-b', unitId: 'die-a', occasionId: 'trial-b'}, {id: 'roll-c', unitId: 'die-a', occasionId: 'trial-c'}],
        observationCount: 3
    },
    attribute: {kind: 'upper-face-number', die: 'standard-six-sided'},
    responseDomain: {kind: 'numeric', values: [{numerator: 1, denominator: 1}, {numerator: 2, denominator: 1}, {numerator: 3, denominator: 1}, {numerator: 4, denominator: 1}, {numerator: 5, denominator: 1}, {numerator: 6, denominator: 1}]},
    variability: {kind: 'anticipated-variation', possibilities: [{observationId: 'roll-a', response: {kind: 'numeric', value: {numerator: 1, denominator: 1}}}, {observationId: 'roll-c', response: {kind: 'numeric', value: {numerator: 6, denominator: 1}}}]}
};

export const literalSingleDieInvestigation: StatisticalInvestigation = {
    id: 'literal-single-die',
    observationPlan: {
        populationName: 'One specified roll',
        units: [{id: 'only-die', name: 'Specified die', kind: 'die'}],
        occasions: [{id: 'only-trial', name: 'Specified trial'}],
        indices: [{id: 'only-roll', unitId: 'only-die', occasionId: 'only-trial'}],
        observationCount: 1
    },
    attribute: {kind: 'upper-face-number', die: 'standard-six-sided'},
    responseDomain: {kind: 'numeric', values: [{numerator: 1, denominator: 1}, {numerator: 2, denominator: 1}, {numerator: 3, denominator: 1}, {numerator: 4, denominator: 1}, {numerator: 5, denominator: 1}, {numerator: 6, denominator: 1}]},
    variability: {kind: 'single-observation', observationId: 'only-roll'}
};

export const literalColorInvestigation: StatisticalInvestigation = {
    id: 'literal-color',
    observationPlan: {
        populationName: 'Two people choosing again',
        units: [{id: 'person-a', name: 'Sam', kind: 'person'}, {id: 'person-b', name: 'Sam', kind: 'person'}],
        occasions: [{id: 'choice-a', name: 'Choice'}, {id: 'choice-b', name: 'Choice'}],
        indices: [{id: 'response-aa', unitId: 'person-a', occasionId: 'choice-a'}, {id: 'response-ab', unitId: 'person-a', occasionId: 'choice-b'}, {id: 'response-ba', unitId: 'person-b', occasionId: 'choice-a'}, {id: 'response-bb', unitId: 'person-b', occasionId: 'choice-b'}],
        observationCount: 4
    },
    attribute: {kind: 'color-choice', alternatives: ['red', 'blue']},
    responseDomain: {kind: 'categorical', values: ['red', 'blue']},
    variability: {kind: 'anticipated-variation', possibilities: [{observationId: 'response-ab', response: {kind: 'categorical', value: 'blue'}}, {observationId: 'response-ba', response: {kind: 'categorical', value: 'red'}}]}
};

export const literalTriangleInvestigation: StatisticalInvestigation = {
    id: 'literal-triangle',
    observationPlan: {
        populationName: 'A collection of triangles',
        units: [{id: 'triangle-a', name: 'Triangle A', kind: 'triangle'}, {id: 'triangle-b', name: 'Triangle B', kind: 'triangle'}],
        occasions: [{id: 'shape-check', name: 'Shape check'}],
        indices: [{id: 'sides-a', unitId: 'triangle-a', occasionId: 'shape-check'}, {id: 'sides-b', unitId: 'triangle-b', occasionId: 'shape-check'}],
        observationCount: 2
    },
    attribute: {kind: 'side-count', shape: 'triangle'},
    responseDomain: {kind: 'numeric', values: [{numerator: 3, denominator: 1}]},
    variability: {kind: 'constant-response', response: {kind: 'numeric', value: {numerator: 3, denominator: 1}}}
};

export const literalRectangleInvestigation: StatisticalInvestigation = {
    id: 'literal-rectangle',
    observationPlan: {
        populationName: 'One specified rectangle',
        units: [{id: 'rectangle-a', name: 'Rectangle A', kind: 'rectangle'}],
        occasions: [{id: 'rectangle-check', name: 'Shape check'}],
        indices: [{id: 'rectangle-sides', unitId: 'rectangle-a', occasionId: 'rectangle-check'}],
        observationCount: 1
    },
    attribute: {kind: 'side-count', shape: 'rectangle'},
    responseDomain: {kind: 'numeric', values: [{numerator: 4, denominator: 1}]},
    variability: {kind: 'constant-response', response: {kind: 'numeric', value: {numerator: 4, denominator: 1}}}
};

export const literalEmptyBoxInvestigation: StatisticalInvestigation = {
    id: 'literal-empty-boxes',
    observationPlan: {
        populationName: 'Boxes packed under one rule',
        units: [{id: 'box-a', name: 'Box A', kind: 'sealed-pencil-box'}, {id: 'box-b', name: 'Box B', kind: 'sealed-pencil-box'}],
        occasions: [{id: 'packing-check', name: 'Packing check'}],
        indices: [{id: 'pencils-a', unitId: 'box-a', occasionId: 'packing-check'}, {id: 'pencils-b', unitId: 'box-b', occasionId: 'packing-check'}],
        observationCount: 2
    },
    attribute: {kind: 'sealed-pencil-count', pencilsPerBox: 0},
    responseDomain: {kind: 'numeric', values: [{numerator: 0, denominator: 1}]},
    variability: {kind: 'constant-response', response: {kind: 'numeric', value: {numerator: 0, denominator: 1}}}
};

export const literalStatisticalQuestionsProblem: StatisticalQuestionsProblem = {
    kind: 'statistical-questions',
    investigations: [literalRepeatedDieInvestigation, literalSingleDieInvestigation, literalTriangleInvestigation]
};

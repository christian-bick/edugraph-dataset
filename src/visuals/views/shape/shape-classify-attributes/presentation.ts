import {
    RightTriangleCategoryProblem,
    ShapeAngleClassificationProblem,
    ShapeAttributeOption,
    ShapeCountClassificationProblem,
    ShapeDefiningAttribute,
    ShapeDefiningAttributeClassificationProblem,
    ShapeDefinition,
    ShapeLineRelationClassificationProblem,
    ShapeSubsumptionProblem
} from '../../../../types/problems.ts';

export type ShapeOptionId = ShapeAttributeOption['id'];
export type PresentedOption<T> = T & {id: ShapeOptionId};

const OPTION_IDS: readonly ShapeOptionId[] = ['A', 'B', 'C', 'D'];

export const RECTANGULAR_PRISM_NET_FACES = [
    {x: 39, y: 0, width: 30, height: 20},
    {x: 39, y: 20, width: 30, height: 12},
    {x: 27, y: 32, width: 12, height: 20},
    {x: 39, y: 32, width: 30, height: 20},
    {x: 69, y: 32, width: 12, height: 20},
    {x: 39, y: 52, width: 30, height: 12}
] as const;

export function withOptionIds<T>(values: readonly T[], seed: number): PresentedOption<T>[] {
    const result = [...values];
    let state = (seed ^ 0x9E3779B9) >>> 0;
    for (let index = result.length - 1; index > 0; index--) {
        state = Math.imul(state ^ state >>> 16, 0x21F0AAAD) >>> 0;
        state = Math.imul(state ^ state >>> 15, 0x735A2D97) >>> 0;
        const swapIndex = ((state ^ state >>> 15) >>> 0) % (index + 1);
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result.map((value, index) => ({...value, id: OPTION_IDS[index]}));
}

export function definingAttributeText(attribute: ShapeDefiningAttribute): string {
    if (attribute.kind === 'closed') return 'is closed';
    if (attribute.kind === 'boundary') {
        return attribute.value === 'curved' ? 'has one curved boundary' : 'has a straight boundary';
    }
    if (attribute.kind === 'side-count') return `has ${attribute.value} straight sides`;
    if (attribute.kind === 'vertex-count') return `has ${attribute.value} vertices`;
    if (attribute.kind === 'equal-sides') return 'has 4 equal sides';
    return 'has 4 right angles';
}

export function definingAttributeMatches(
    definition: ShapeDefinition,
    attribute: ShapeDefiningAttribute
): boolean {
    if (attribute.kind === 'closed') return definition.closed;
    if (attribute.kind === 'boundary') return definition.boundary === attribute.value;
    if (attribute.kind === 'side-count') return definition.sideCount === attribute.value;
    if (attribute.kind === 'vertex-count') return definition.vertexCount === attribute.value;
    if (attribute.kind === 'equal-sides') return definition.equalSides === attribute.value;
    return definition.rightAngleCount === attribute.value;
}

const NON_DEFINING_OPTIONS = [
    {text: 'is blue', kind: 'non-defining' as const},
    {text: 'points upward', kind: 'non-defining' as const},
    {text: 'is large', kind: 'non-defining' as const}
];

export function definingOptions(
    data: ShapeDefiningAttributeClassificationProblem,
    seed: number
): ShapeAttributeOption[] {
    return withOptionIds([
        {text: definingAttributeText(data.definingAttribute), kind: 'defining' as const},
        ...NON_DEFINING_OPTIONS
    ], seed);
}

export function visibleAttributes(definition: ShapeDefinition): string[] {
    const attributes = definition.boundary === 'curved'
        ? ['one curved boundary', '0 vertices']
        : [`${definition.sideCount} straight sides`, `${definition.vertexCount} vertices`];
    if (definition.equalSides) attributes.push('4 equal sides');
    if (definition.rightAngleCount) attributes.push('4 right angles');
    return attributes;
}

export function subsumptionOptions(
    data: ShapeSubsumptionProblem,
    seed: number
) {
    return withOptionIds([
        {category: 'triangle' as const},
        {category: 'quadrilateral' as const},
        {category: 'pentagon' as const},
        {category: 'hexagon' as const}
    ], seed).map(option => ({
        ...option,
        satisfies: option.category === data.category
    }));
}

export function countOptions(data: ShapeCountClassificationProblem, seed: number) {
    return withOptionIds(data.options, seed);
}

type Grade4Problem =
    | ShapeLineRelationClassificationProblem
    | ShapeAngleClassificationProblem
    | RightTriangleCategoryProblem;

export function grade4Presentation(data: Grade4Problem, seed: number) {
    const options = withOptionIds<Grade4Problem['options'][number]>(
        data.options as readonly Grade4Problem['options'][number][],
        seed
    );
    const answerIds = options.filter(option => option.satisfies).map(option => option.id);
    if (data.task === 'classify-line-relation') {
        const phrase = data.criterion === 'parallel' ? 'parallel sides' : 'perpendicular sides';
        return {
            prompt: `Classify each figure by whether it has ${phrase}.`,
            positiveLabel: `has ${phrase}`,
            negativeLabel: `does not have ${phrase}`,
            options,
            answerIds,
            answerStatement: `Figures ${answerIds.join(' and ')} have ${phrase}.`,
            explanation: data.criterion === 'parallel'
                ? 'Their marked sides stay the same distance apart and never intersect.'
                : 'Their marked sides intersect to form a right angle.',
            attributes: [] as string[],
            categoryStatement: ''
        };
    }
    if (data.task === 'classify-angle-size') {
        const article = data.criterion === 'right' ? 'a' : 'an';
        return {
            prompt: `Classify each figure by whether it has ${article} ${data.criterion} angle.`,
            positiveLabel: `has ${article} ${data.criterion} angle`,
            negativeLabel: `does not have ${article} ${data.criterion} angle`,
            options,
            answerIds,
            answerStatement: `Figures ${answerIds.join(' and ')} each have ${article} ${data.criterion} angle.`,
            explanation: data.criterion === 'right'
                ? 'Each highlighted angle forms a square corner.'
                : data.criterion === 'acute'
                    ? 'Each highlighted angle is smaller than a right angle.'
                    : 'Each highlighted angle is larger than a right angle and smaller than a straight angle.',
            attributes: [] as string[],
            categoryStatement: ''
        };
    }
    return {
        prompt: 'Which figures are right triangles?',
        positiveLabel: 'right triangle',
        negativeLabel: 'not a right triangle',
        options,
        answerIds,
        answerStatement: `Figures ${answerIds.join(' and ')} are right triangles.`,
        explanation: 'Each has three straight sides and one right angle. Every right triangle is a triangle.',
        attributes: ['3 straight sides', '1 right angle'],
        categoryStatement: 'Every right triangle is a triangle.'
    };
}

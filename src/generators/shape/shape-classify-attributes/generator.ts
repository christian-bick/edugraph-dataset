import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    ShapeAttributeClassificationProblem,
    ShapeAttributeOption
} from '../../../types/problems.ts';
import {
    getDefiningAttributeStatements,
    getShapeDefinition,
    NON_DEFINING_ATTRIBUTE_STATEMENTS,
    PLANE_SHAPE_LABELS,
    shapeNameFromLabel
} from '../helpers.ts';
import {
    ShapeClassifyAttributesGeneratorConfig,
    ShapeClassifyAttributesGeneratorSchema
} from './spec.ts';

const OPTION_IDS: ShapeAttributeOption['id'][] = ['A', 'B', 'C', 'D'];

type UnpositionedOption = Pick<ShapeAttributeOption, 'text' | 'kind'>;

function pickRandom<T>(values: readonly T[]): T {
    return values[Math.floor(random() * values.length)];
}

function shuffleOptions(options: readonly UnpositionedOption[]): ShapeAttributeOption[] {
    const shuffled = [...options];

    for (let index = shuffled.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled.map((option, index) => ({
        ...option,
        id: OPTION_IDS[index]
    }));
}

export class ShapeClassifyAttributesGenerator implements ProblemGenerator<
    ShapeAttributeClassificationProblem,
    ShapeClassifyAttributesGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeClassifyAttributesGeneratorSchema;

    generate(
        config: ShapeClassifyAttributesGeneratorConfig
    ): ProblemStub<ShapeAttributeClassificationProblem> | null {
        validateConfigFields('shape-classify-attributes', config, []);

        const shapeLabel = pickRandom(PLANE_SHAPE_LABELS);
        const shape = shapeNameFromLabel(shapeLabel);
        if (!shape) return null;

        const definingStatement = pickRandom(getDefiningAttributeStatements(shape));
        const options = shuffleOptions([
            {text: definingStatement, kind: 'defining'},
            ...NON_DEFINING_ATTRIBUTE_STATEMENTS.map(text => ({
                text,
                kind: 'non-defining' as const
            }))
        ]);
        const answer = options.find(option => option.kind === 'defining')!.id;

        return {
            data: {
                shape,
                definition: getShapeDefinition(shape),
                options,
                answer
            },
            tags: [shapeLabel]
        };
    }
}

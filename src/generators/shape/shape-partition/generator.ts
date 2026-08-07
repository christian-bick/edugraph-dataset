import {Ability, Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    FractionParts,
    FractionShape,
    FractionShareName,
    ShapePartitionProblem
} from '../../../types/problems.ts';
import {ShapePartitionGeneratorConfig, ShapePartitionGeneratorSchema} from './spec.ts';

type FractionTask = ShapePartitionProblem['task'];

function resolveShape(label: string): FractionShape | null {
    if (label === Area.Circle) return 'circle';
    if (label === Area.Rectangle) return 'rectangle';
    return null;
}

function resolveTask(ability: string): FractionTask | null {
    if (ability === Ability.VisualArticulation) return 'partition';
    if (ability === Ability.ActiveVocabulary) return 'name-share';
    if (ability === Ability.ConceptComposition) return 'compose-whole';
    if (ability === Ability.ConceptDerivation) return 'compare-share-size';
    return null;
}

function pickParts(): FractionParts {
    return random() < 0.5 ? 2 : 4;
}

function pickShareName(parts: FractionParts): FractionShareName {
    if (parts === 2) return 'half';
    return random() < 0.5 ? 'fourth' : 'quarter';
}

function hasValidCapabilities(
    task: FractionTask,
    unitFractions: boolean,
    isLessComparison: boolean
): boolean {
    const requiresUnitFractions = task !== 'partition';
    const requiresLessComparison = task === 'compare-share-size';
    return unitFractions === requiresUnitFractions &&
        isLessComparison === requiresLessComparison;
}

export class ShapePartitionGenerator implements ProblemGenerator<
    ShapePartitionProblem,
    ShapePartitionGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapePartitionGeneratorSchema;

    generate(
        config: ShapePartitionGeneratorConfig
    ): ProblemStub<ShapePartitionProblem> | null {
        validateConfigFields('shape-partition', config, [
            'shape',
            'taskAbility',
            'unitFractions',
            'isLessComparison'
        ]);

        const shape = resolveShape(config.shape!);
        const task = resolveTask(config.taskAbility!);
        if (!shape || !task || !hasValidCapabilities(
            task,
            config.unitFractions!,
            config.isLessComparison!
        )) return null;

        if (task === 'compare-share-size') {
            return {
                data: {
                    task,
                    shape,
                    shares: [
                        {parts: 2, shareName: 'half'},
                        {parts: 4, shareName: 'fourth'}
                    ],
                    relation: 'less',
                    answer: 'fourth'
                }
            };
        }

        const parts = pickParts();
        if (task === 'partition') {
            return {data: {task, shape, parts}};
        }

        if (task === 'compose-whole') {
            return {
                data: {
                    task,
                    shape,
                    parts,
                    shareName: parts === 2 ? 'half' : 'fourth',
                    answer: 'one whole'
                }
            };
        }

        const shareName = pickShareName(parts);
        return {
            data: {
                task,
                shape,
                parts,
                shareName,
                selectedShare: Math.floor(random() * parts),
                answer: shareName
            }
        };
    }
}

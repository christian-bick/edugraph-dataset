import {Ability, Area, Scope} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    FractionParts,
    FractionShape,
    FractionShareName,
    ShapePartitionProblem
} from '../../../types/problems.ts';
import {ShapePartitionGeneratorConfig, ShapePartitionGeneratorSchema} from './spec.ts';

type LegacyFractionTask = 'partition' | 'name-share' | 'compose-whole' | 'compare-share-size';

function resolveShape(label: string): FractionShape | null {
    if (label === Area.Circle) return 'circle';
    if (label === Area.Rectangle) return 'rectangle';
    return null;
}

function resolveLegacyTask(abilities: readonly string[]): LegacyFractionTask | null {
    if (abilities.length !== 1) return null;
    if (abilities[0] === Ability.VisualArticulation) return 'partition';
    if (abilities[0] === Ability.ActiveVocabulary) return 'name-share';
    if (abilities[0] === Ability.ConceptComposition) return 'compose-whole';
    if (abilities[0] === Ability.ConceptDerivation) return 'compare-share-size';
    return null;
}

function pickLegacyParts(): 2 | 4 {
    return random() < 0.5 ? 2 : 4;
}

function pickShareName(parts: 2 | 4): FractionShareName {
    if (parts === 2) return 'half';
    return random() < 0.5 ? 'fourth' : 'quarter';
}

function hasValidLegacyCapabilities(
    task: LegacyFractionTask,
    fractionTypes: readonly string[],
    fractionNotation: boolean,
    isLessComparison: boolean
): boolean {
    const requiresUnitFractions = task !== 'partition';
    const requiresLessComparison = task === 'compare-share-size';
    return fractionTypes.includes(Scope.UnitFractions) === requiresUnitFractions &&
        !fractionTypes.includes(Scope.NonUnitFractions) &&
        !fractionNotation &&
        isLessComparison === requiresLessComparison;
}

const GRADE_3_PARTS: readonly FractionParts[] = [2, 3, 4, 6, 8];

function pickGrade3Parts(includeTwo = true): FractionParts {
    const choices = includeTwo ? GRADE_3_PARTS : GRADE_3_PARTS.slice(1);
    return choices[Math.floor(random() * choices.length)];
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
            'taskAbilities',
            'fractionNotation',
            'isLessComparison'
        ]);

        if (!Array.isArray(config.fractionTypes)) {
            throw new GeneratorValidationError(
                'shape-partition',
                'The fractionTypes field must be an array.'
            );
        }

        const shape = resolveShape(config.shape!);
        const abilities = config.taskAbilities!;
        const fractionTypes = config.fractionTypes;
        if (!shape || !Array.isArray(abilities)) return null;

        const partitionsAndFormalizes = abilities.includes(Ability.VisualArticulation)
            && abilities.includes(Ability.Formalization)
            && abilities.length === 2;
        if (
            partitionsAndFormalizes
            && fractionTypes.length === 1
            && fractionTypes[0] === Scope.UnitFractions
            && !config.fractionNotation
            && !config.isLessComparison
        ) {
            const parts = pickGrade3Parts();
            const unitFraction = `1/${parts}`;
            return {
                data: {
                    task: 'partition-and-label-unit-fraction',
                    shape,
                    parts,
                    selectedShare: Math.floor(random() * parts),
                    unitFraction,
                    answer: `${unitFraction} of the whole`
                }
            };
        }

        const interpretsFraction = abilities.length === 1
            && abilities[0] === Ability.ConceptDerivation
            && config.fractionNotation
            && !config.isLessComparison
            && fractionTypes.length === 1;
        if (interpretsFraction) {
            const isUnitFraction = fractionTypes[0] === Scope.UnitFractions;
            const isNonUnitFraction = fractionTypes[0] === Scope.NonUnitFractions;
            if (!isUnitFraction && !isNonUnitFraction) return null;
            const parts = pickGrade3Parts(isUnitFraction);
            const numerator = isUnitFraction
                ? 1
                : 2 + Math.floor(random() * (parts - 2));
            const fraction = `${numerator}/${parts}`;
            return {
                data: {
                    task: 'interpret-fraction',
                    shape,
                    parts,
                    numerator,
                    highlightedShares: Array.from({length: numerator}, (_, index) => index),
                    unitFraction: `1/${parts}`,
                    fraction,
                    answer: fraction
                }
            };
        }

        const task = resolveLegacyTask(abilities);
        if (!task || !hasValidLegacyCapabilities(
            task,
            fractionTypes,
            config.fractionNotation!,
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

        const parts = pickLegacyParts();
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

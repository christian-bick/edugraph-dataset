import {Area, Scope} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    FractionParts,
    FractionShape,
    ShapePartitionProblem
} from '../../../types/problems.ts';
import {ShapePartitionGeneratorConfig, ShapePartitionGeneratorSchema} from './spec.ts';

function resolveShape(label: string): FractionShape | null {
    if (label === Area.Circle) return 'circle';
    if (label === Area.Rectangle) return 'rectangle';
    return null;
}

function pickLegacyParts(): 2 | 4 {
    return random() < 0.5 ? 2 : 4;
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
            'taskAreas',
            'shape',
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
        const taskAreas = config.taskAreas!;
        const fractionTypes = config.fractionTypes;
        if (!shape || !Array.isArray(taskAreas)) return null;

        const isComparisonModel = taskAreas.length === 1
            && taskAreas[0] === Area.FractionCommonNumeratorComparison;
        const isFractionRegionModel = taskAreas.length > 0 && taskAreas.every(area =>
            area === Area.ProportionSense || area === Area.FractionInterpretation
        );

        if (
            isComparisonModel
            && config.isLessComparison
            && fractionTypes.length === 1
            && fractionTypes[0] === Scope.UnitFractions
            && !config.fractionNotation
        ) {
            return {
                data: {
                    model: 'unit-share-comparison',
                    shape,
                    unitFractions: [
                        {numerator: 1, denominator: 2, display: '1/2'},
                        {numerator: 1, denominator: 4, display: '1/4'}
                    ],
                    relation: 'less',
                    lesserFraction: '1/4'
                }
            };
        }

        if (
            isFractionRegionModel
            && config.fractionNotation
            && !config.isLessComparison
            && fractionTypes.length === 1
        ) {
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
                    model: 'fraction-region',
                    shape,
                    parts,
                    numerator,
                    unitFraction: `1/${parts}`,
                    fraction
                }
            };
        }

        if (config.fractionNotation || config.isLessComparison) return null;
        const supportsEqualShareModel = taskAreas.some(area =>
            area === Area.ProportionSense
            || area === Area.ShapeDecomposition
            || area === Area.FractionInterpretation
        );
        const supportsFractionType = fractionTypes.length === 0
            || (fractionTypes.length === 1 && fractionTypes[0] === Scope.UnitFractions);
        if (!supportsEqualShareModel || !supportsFractionType) return null;

        const usesBroadPartitionModel = taskAreas.includes(Area.ProportionSense)
            && fractionTypes[0] === Scope.UnitFractions;
        const parts = usesBroadPartitionModel ? pickGrade3Parts() : pickLegacyParts();
        return {
            data: {
                model: 'equal-share-partition',
                shape,
                parts,
                wholeCount: 1,
                unitFraction: fractionTypes[0] === Scope.UnitFractions
                    ? `1/${parts}`
                    : null
            }
        };
    }
}

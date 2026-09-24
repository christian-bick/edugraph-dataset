import {Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'statistical-graphs',
    compatibility: [generatorLabelRule('categorical-task-configuration', [
        Area.Addition, Area.Subtraction, Area.ObjectSorting, Scope.ThreeOperands,
        Scope.SingleStep, Scope.MultiStep, Scope.StepsOf1
    ], selected => {
        const addition = selected(Area.Addition);
        const subtraction = selected(Area.Subtraction);
        const sorting = selected(Area.ObjectSorting);
        const total = selected(Scope.ThreeOperands);
        const singleStep = selected(Scope.SingleStep);
        const multiStep = selected(Scope.MultiStep);
        const steps = Number(singleStep) + Number(multiStep);
        if (addition && subtraction || sorting && total) return false;
        if (!total && (addition || subtraction) !== (steps === 1)) return false;
        if (multiStep && !subtraction) return false;
        if (sorting && (addition || subtraction || steps > 0)) return false;
        if (total && (!addition || subtraction || steps > 0)) return false;
        return !(sorting || total) || selected(Scope.StepsOf1);
    })],
    generalLabels: [Area.Statistics, Scope.IntegerNumbers]
};

export const StatisticalGraphsGeneratorSchema = {
    scale: [Scope.StepsOf1, Scope.StepsOf2, Scope.StepsOf5, Scope.StepsOf10],
    useAddition: [[Area.Addition], hasLabel(Area.Addition)],
    useSubtraction: [[Area.Subtraction], hasLabel(Area.Subtraction)],
    useObjectSorting: [[Area.ObjectSorting], hasLabel(Area.ObjectSorting)],
    requireThreeOperands: [[Scope.ThreeOperands], hasLabel(Scope.ThreeOperands)],
    isSingleStep: [[Scope.SingleStep], hasLabel(Scope.SingleStep)],
    isMultiStep: [[Scope.MultiStep], hasLabel(Scope.MultiStep)]
} as const;

export type StatisticalGraphsGeneratorConfig = ConfigFromSchema<typeof StatisticalGraphsGeneratorSchema>;

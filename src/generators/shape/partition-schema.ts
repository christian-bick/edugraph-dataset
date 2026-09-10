import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../lib/resolvers.ts';

export const partitionShape = [[Area.Circle, Area.Rectangle], selectExactLabelMap([
    [Area.Circle, 'circle'],
    [Area.Rectangle, 'rectangle']
] as const)] as const;

export const partitionDenominators = [
    [Scope.HalfFractions, 2],
    [Scope.ThirdFractions, 3],
    [Scope.QuarterFractions, 4],
    [Scope.SixthFractions, 6],
    [Scope.EighthFractions, 8]
] as const;

export const partitionParts = [
    partitionDenominators.map(([label]) => label),
    selectExactLabelMap(partitionDenominators)
] as const;

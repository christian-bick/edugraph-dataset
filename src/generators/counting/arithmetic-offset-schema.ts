import {Area} from 'edugraph-ts';
import {selectExactLabelMap} from '../../lib/resolvers.ts';

export const arithmeticOffsetDirection = [
    [Area.Increment, Area.Decrement],
    selectExactLabelMap([
        [Area.Increment, 'inc'],
        [Area.Decrement, 'dec']
    ] as const)
] as const;

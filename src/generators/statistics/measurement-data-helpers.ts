import {random} from '../../lib/random.ts';
import {MeasurementObservation} from '../../types/problems.ts';

const objects: MeasurementObservation['object'][] = ['pencil', 'crayon', 'ribbon', 'key', 'brush', 'block'];

const shuffle = <T>(values: T[]): T[] => {
    for (let index = values.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [values[index], values[swapIndex]] = [values[swapIndex]!, values[index]!];
    }
    return values;
};

const makeObservations = (lengths: readonly number[]): MeasurementObservation[] =>
    objects.map((object, index) => ({object, value: lengths[index]!}));

export const makeEighthUnitObservations = (): MeasurementObservation[] => {
    const axisStartEighths = (1 + Math.floor(random() * 2)) * 8;
    const interiorOffset = 5 + Math.floor(random() * 10);
    const offsets = shuffle([1, 2, 4, 4, interiorOffset, 16]);
    return makeObservations(offsets.map(offset => (axisStartEighths + offset) / 8));
};

export const makeQuarterUnitObservations = (): MeasurementObservation[] => {
    const quarterUnits = [
        (2 + Math.floor(random() * 6)) * 4 + 1,
        (2 + Math.floor(random() * 6)) * 4 + 2,
        ...Array.from({length: objects.length - 2}, () => 8 + Math.floor(random() * 25))
    ];
    return makeObservations(quarterUnits.map(value => value / 4));
};

export const makeWholeUnitObservations = (): MeasurementObservation[] =>
    makeObservations(objects.map(() => 2 + Math.floor(random() * 9)));

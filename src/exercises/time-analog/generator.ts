import PermutationBuilder from "../../lib/permutation-builder.ts";
import {Ability, Area, Scope} from "edugraph-ts";

function generatePermutations() {
    return new PermutationBuilder()
        .applyVariants('interval', [3600, 1800, 900, 60, 1])
        .applyVariants('reverse', ['true', 'false'])
        .build()
}

function generateName(params: { [key: string]: any }) {
    const {interval, reverse} = params;
    let intervalName = '';
    if (interval === 3600) intervalName = 'hour';
    else if (interval === 1800) intervalName = 'half';
    else if (interval === 900) intervalName = 'quarter';
    else if (interval === 60) intervalName = 'minute';
    else if (interval === 1) intervalName = 'second';
    let name = `time-read-${intervalName}`;
    if (reverse === 'true') {
        name += '_reverse';
    }
    return name;
}

function generateLabels(params: { [key: string]: any }) {
    const {interval, reverse} = params;
    let intervalScope;
    if (interval < 60) {
        intervalScope = Scope.SecondIntervals
    } else if (interval < 3600) {
        intervalScope = Scope.MinuteIntervals
    } else {
        intervalScope = Scope.HourIntervals
    }
    return {
        Area: [Area.MeasuringTime],
        Scope: [Scope.AnalogClock, intervalScope],
        Ability: [Ability.ProcedureApplication, Ability.ProcedureExecution],
    }
}

export default {
    generatePermutations,
    generateName,
    generateLabels,
}

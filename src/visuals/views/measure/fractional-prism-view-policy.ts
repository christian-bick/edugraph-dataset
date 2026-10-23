import {Area, Scope} from 'edugraph-ts';
import type {ViewCompatibilityRule} from '../../../types/compatibility.ts';

/** Formula-only premises cannot preserve selected packing or cube-scale claims. */
export const prismFormulaEvidence: ViewCompatibilityRule = {
    id: 'prism-volume-formula-evidence',
    description: 'Formula premises show physical measurements without the packing or cube-scale model.',
    dependencies: [
        {scope: 'generator', label: Area.MeasuringVolumes},
        {scope: 'generator', label: Scope.CubeScale}
    ],
    predicate: labels => !labels.has('generator', Area.MeasuringVolumes)
        && !labels.has('generator', Scope.CubeScale)
};

import {Area} from 'edugraph-ts';
import type {ViewCompatibilityRule} from '../../../types/compatibility.ts';

export const netConstructionEvidence: ViewCompatibilityRule = {
    id: 'solid-net-construction-evidence',
    description: 'Net construction preserves face incidence without requesting a surface-area calculation.',
    dependencies: [{scope: 'generator', label: Area.SurfaceAreaCalculation}],
    predicate: labels => !labels.has('generator', Area.SurfaceAreaCalculation)
};
export const netSurfaceAreaEvidence: ViewCompatibilityRule = {
    id: 'net-surface-area-evidence',
    description: 'Surface-area execution requires the selected complete external-face addition relation.',
    dependencies: [{scope: 'generator', label: Area.SurfaceAreaCalculation}],
    predicate: labels => labels.has('generator', Area.SurfaceAreaCalculation)
};

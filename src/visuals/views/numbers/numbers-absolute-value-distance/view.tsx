import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isRationalMagnitudeRelation} from '../rational-order-magnitude-helpers.ts';
import {AbsoluteValueDistanceBody} from '../rational-order-magnitude-view.tsx';
import {NumbersAbsoluteValueDistanceViewSchema, type NumbersAbsoluteValueDistanceViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-absolute-value-distance';
export const NumbersAbsoluteValueDistanceCore = ({payload}: {config: NumbersAbsoluteValueDistanceViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'axis', 'point', 'distance']);
    if (!isRationalMagnitudeRelation(data)) throw new ViewValidationError(VIEW_ID, 'The exact scale, context, ordering or magnitude witnesses are inconsistent.');
    return <AbsoluteValueDistanceBody data={data} isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const NumbersAbsoluteValueDistance = withConfig(NumbersAbsoluteValueDistanceViewSchema, NumbersAbsoluteValueDistanceCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumbersAbsoluteValueDistance payload={payload} />);
};

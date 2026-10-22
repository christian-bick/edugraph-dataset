import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isRationalOrderRelation} from '../rational-order-magnitude-helpers.ts';
import {InequalityLineBody} from '../rational-order-magnitude-view.tsx';
import {NumbersInequalityLineInterpretationViewSchema, type NumbersInequalityLineInterpretationViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-inequality-line-interpretation';
export const NumbersInequalityLineInterpretationCore = ({payload}: {config: NumbersInequalityLineInterpretationViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'axis', 'first', 'second', 'relation']);
    if (!isRationalOrderRelation(data)) throw new ViewValidationError(VIEW_ID, 'The exact scale, context, ordering or magnitude witnesses are inconsistent.');
    return <InequalityLineBody data={data} isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const NumbersInequalityLineInterpretation = withConfig(NumbersInequalityLineInterpretationViewSchema, NumbersInequalityLineInterpretationCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumbersInequalityLineInterpretation payload={payload} />);
};

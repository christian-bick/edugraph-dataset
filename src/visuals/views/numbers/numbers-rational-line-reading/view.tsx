import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isRationalNumberlineValues} from '../rational-numberline-helpers.ts';
import {RationalLineReadingBody} from '../rational-numberline-view.tsx';
import {NumbersRationalLineReadingViewSchema, type NumbersRationalLineReadingViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-rational-line-reading';
export const NumbersRationalLineReadingCore = ({payload}: {config: NumbersRationalLineReadingViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'axis', 'point']);
    if (!isRationalNumberlineValues(data)) throw new ViewValidationError(VIEW_ID, 'The exact scale, notation or located-value witnesses are inconsistent.');
    return <RationalLineReadingBody data={data} isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const NumbersRationalLineReading = withConfig(NumbersRationalLineReadingViewSchema, NumbersRationalLineReadingCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumbersRationalLineReading payload={payload} />);
};

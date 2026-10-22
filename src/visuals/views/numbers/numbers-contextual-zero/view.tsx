import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {isSignedRationalContext} from '../signed-meaning-helpers.ts';
import {SignedContextBody} from '../signed-context-view.tsx';
import {withConfig} from '../../withConfig.tsx';
import {NumbersContextualZeroViewSchema, type NumbersContextualZeroViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-contextual-zero';
export const NumbersContextualZeroCore = ({payload}: {config: NumbersContextualZeroViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'context', 'observations']);
    if (!isSignedRationalContext(data)) throw new ViewValidationError(VIEW_ID, 'The exact signed values, semantic metadata or relation witnesses are inconsistent.');
    return <SignedContextBody data={data} task="contextual-zero" isSolutionView={payload.isSolutionView} />;
};
export const NumbersContextualZero = withConfig(NumbersContextualZeroViewSchema, NumbersContextualZeroCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumbersContextualZero payload={payload} />);
};

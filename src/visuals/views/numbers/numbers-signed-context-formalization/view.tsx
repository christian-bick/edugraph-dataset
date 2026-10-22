import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {isSignedRationalContext} from '../signed-meaning-helpers.ts';
import {SignedContextBody} from '../signed-context-view.tsx';
import {withConfig} from '../../withConfig.tsx';
import {NumbersSignedContextFormalizationViewSchema, type NumbersSignedContextFormalizationViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-signed-context-formalization';
export const NumbersSignedContextFormalizationCore = ({payload}: {config: NumbersSignedContextFormalizationViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'context', 'observations']);
    if (!isSignedRationalContext(data)) throw new ViewValidationError(VIEW_ID, 'The exact signed values, semantic metadata or relation witnesses are inconsistent.');
    return <SignedContextBody data={data} task="signed-context-formalization" isSolutionView={payload.isSolutionView} />;
};
export const NumbersSignedContextFormalization = withConfig(NumbersSignedContextFormalizationViewSchema, NumbersSignedContextFormalizationCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumbersSignedContextFormalization payload={payload} />);
};

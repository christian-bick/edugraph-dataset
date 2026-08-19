import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {ArithmeticWordProblemWithin100View} from '../arithmetic-word-problem-within-100-view.tsx';
import {OperationsWordProblemEquationFormalizationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {payload: ViewRenderPayload<'operations-word-problem-equation-formalization'>}
const Core = ({payload}: CoreProps) => (
    <ArithmeticWordProblemWithin100View
        config={{expectedKind: 'letter-equation', invertProcedure: false, useLengthContext: false}}
        payload={payload}
    />
);
export const OperationsWordProblemEquationFormalization = withConfig(
    OperationsWordProblemEquationFormalizationViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'operations-word-problem-equation-formalization'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsWordProblemEquationFormalization payload={payload} />);
};

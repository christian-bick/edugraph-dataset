import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {ArithmeticWordProblemView} from '../arithmetic-word-problem-view.tsx';
import {
    OperationsWordProblemInversionViewConfig,
    OperationsWordProblemInversionViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsWordProblemInversionViewConfig;
    payload: ViewRenderPayload<'operations-word-problem-inversion'>;
}

const Core = ({payload}: CoreProps) => (
    <ArithmeticWordProblemView invertProcedure payload={payload} />
);

export const OperationsWordProblemInversion = withConfig(
    OperationsWordProblemInversionViewSchema,
    Core
);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'operations-word-problem-inversion'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsWordProblemInversion payload={payload} />);
};

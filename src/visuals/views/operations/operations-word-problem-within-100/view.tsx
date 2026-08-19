import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {ArithmeticWordProblemWithin100View} from '../arithmetic-word-problem-within-100-view.tsx';
import {
    OperationsWordProblemWithin100ViewConfig,
    OperationsWordProblemWithin100ViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsWordProblemWithin100ViewConfig;
    payload: ViewRenderPayload<'operations-word-problem-within-100'>;
}

const Core = ({config, payload}: CoreProps) => (
    <ArithmeticWordProblemWithin100View
        config={{
            invertProcedure: false,
            useLengthContext: config.useLengthContext ?? false
        }}
        payload={payload}
    />
);

export const OperationsWordProblemWithin100 = withConfig(
    OperationsWordProblemWithin100ViewSchema,
    Core
);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'operations-word-problem-within-100'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsWordProblemWithin100 payload={payload} />);
};

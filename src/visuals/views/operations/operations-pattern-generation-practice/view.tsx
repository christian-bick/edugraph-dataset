import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {PatternExplanationView} from '../pattern-explanation-view.tsx';
import {
    OperationsPatternGenerationPracticeViewConfig,
    OperationsPatternGenerationPracticeViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-pattern-generation-practice';

interface CoreProps {
    config: OperationsPatternGenerationPracticeViewConfig;
    payload: ViewRenderPayload<'operations-pattern-generation-practice'>;
}

const OperationsPatternGenerationPracticeCore = ({payload}: CoreProps) => (
    <PatternExplanationView mode="generation-practice" payload={payload} viewId={VIEW_ID} />
);

export const OperationsPatternGenerationPractice = withConfig(
    OperationsPatternGenerationPracticeViewSchema,
    OperationsPatternGenerationPracticeCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-pattern-generation-practice'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsPatternGenerationPractice payload={payload} />);
    }
};

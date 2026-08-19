import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {PatternTableView} from '../pattern-table-view.tsx';
import {
    OperationsPatternGenerationTableViewConfig,
    OperationsPatternGenerationTableViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-pattern-generation-table';

interface CoreProps {
    config: OperationsPatternGenerationTableViewConfig;
    payload: ViewRenderPayload<'operations-pattern-generation-table'>;
}

const OperationsPatternGenerationTableCore = ({payload}: CoreProps) => (
    <PatternTableView mode="generation" payload={payload} viewId={VIEW_ID} />
);

export const OperationsPatternGenerationTable = withConfig(
    OperationsPatternGenerationTableViewSchema,
    OperationsPatternGenerationTableCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-pattern-generation-table'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsPatternGenerationTable payload={payload} />);
    }
};

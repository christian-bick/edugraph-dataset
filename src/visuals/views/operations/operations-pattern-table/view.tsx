import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {PatternTableView} from '../pattern-table-view.tsx';
import {OperationsPatternTableViewConfig, OperationsPatternTableViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-pattern-table';

interface CoreProps {
    config: OperationsPatternTableViewConfig;
    payload: ViewRenderPayload<'operations-pattern-table'>;
}

const OperationsPatternTableCore = ({payload}: CoreProps) => (
    <PatternTableView mode="legacy-classification" payload={payload} viewId={VIEW_ID} />
);

export const OperationsPatternTable = withConfig(
    OperationsPatternTableViewSchema,
    OperationsPatternTableCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-pattern-table'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsPatternTable payload={payload} />);
    }
};

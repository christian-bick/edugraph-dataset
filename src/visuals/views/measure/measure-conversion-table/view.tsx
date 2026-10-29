import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {MeasureConversionTableCore} from '../measure-conversion-table-view.tsx';
import {MeasureConversionTableViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'measure-conversion-table';

export const MeasureConversionTable = withConfig(
    MeasureConversionTableViewSchema,
    MeasureConversionTableCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<MeasureConversionTable payload={payload} />);
};

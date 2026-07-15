import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

async function main() {
    const viewsDir = resolve(PROJECT_ROOT, 'src', 'visuals', 'views');
    const allViewDirs = readdirSync(viewsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    for (const viewId of allViewDirs) {
        const viewSpecPath = resolve(viewsDir, viewId, 'spec.ts');
        if (existsSync(viewSpecPath)) {
            try {
                const viewSpecModule = await import(`../src/visuals/views/${viewId}/spec.ts`);
                const labels = viewSpecModule.spec.supportedLabels || [];
                console.log(`View [${viewId}]:`, labels.map((l: string) => l.split('/').pop()));
            } catch (e) {
                console.error(`Error loading ${viewId}:`, e);
            }
        }
    }
}
main();

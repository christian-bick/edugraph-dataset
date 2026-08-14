// vite.config.js
import { createReadStream, existsSync, globSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative, extname, sep } from 'path';
import { execFile } from 'node:child_process';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { localAssetRequestKey } from './src/lib/local-assets.ts';

const VIEW_HEAD_PATH = resolve(import.meta.dirname, 'src/partials/head.html');
const VIEW_HEAD_INVOCATION = /\{\{>\s*head\s+script=(['"])([^'"]+)\1\s*\}\}/g;
const COVERAGE_SITE = 'https://coverage.edugraph.io';
const LOCAL_COVERAGE_ROUTES = new Map([
    ['/coverage/preview/ccss-tree.json', 'tree'],
    ['/coverage/preview/ccss-coverage.json', 'coverage'],
    ['/coverage/preview/coverage-manifest.json', 'manifest'],
]);
const LOCAL_DATASET_ROUTE = '/dataset/local/';
const LOCAL_ASSET_INDEX_ROUTE = '/dataset/local-asset-index.json';
const VITE_NODE_WORKER = resolve(import.meta.dirname, 'node_modules', 'vite-node', 'dist', 'cli.mjs');
const LOCAL_ASSET_INDEX_SCRIPT = resolve(
    import.meta.dirname,
    'src',
    'scripts',
    'build-local-asset-index.ts',
);
const LOCAL_COVERAGE_SCRIPT = resolve(import.meta.dirname, 'src', 'scripts', 'build-local-coverage.ts');
const LOCAL_ASSET_WATCH_ROOTS = [
    resolve(import.meta.dirname, 'out'),
    resolve(import.meta.dirname, 'src', 'spec'),
];
const LOCAL_COVERAGE_WATCH_ROOTS = [
    resolve(import.meta.dirname, 'package.json'),
    resolve(import.meta.dirname, 'src', 'spec'),
    resolve(import.meta.dirname, 'src', 'generators'),
    resolve(import.meta.dirname, 'src', 'visuals', 'views'),
    resolve(import.meta.dirname, 'out'),
    resolve(import.meta.dirname, 'src', 'scripts', 'build-local-coverage.ts'),
    resolve(import.meta.dirname, 'src', 'lib', 'asset-index.ts'),
    resolve(import.meta.dirname, 'src', 'lib', 'asset-index-builder.ts'),
    resolve(import.meta.dirname, 'src', 'lib', 'generation.ts'),
    resolve(import.meta.dirname, 'src', 'lib', 'standards-coverage.ts'),
    resolve(import.meta.dirname, 'public', 'coverage', 'ccss-tree.json'),
];

function coverageProxy() {
    return {
        target: COVERAGE_SITE,
        changeOrigin: true,
        secure: true,
    };
}

const isLocalRequest = request => {
    const hostname = (request.headers.host || '').split(':')[0];
    return hostname === 'localhost' || hostname === '127.0.0.1';
};

function localCoveragePlugin() {
    let bundlePromise;
    const invalidate = () => {
        bundlePromise = undefined;
    };
    const getBundle = () => {
        bundlePromise ??= new Promise((accept, reject) => {
            execFile(
                process.execPath,
                [VITE_NODE_WORKER, LOCAL_COVERAGE_SCRIPT],
                {cwd: import.meta.dirname, maxBuffer: 50 * 1024 * 1024},
                (error, stdout, stderr) => {
                    if (error) {
                        reject(new Error(stderr.trim() || error.message));
                        return;
                    }
                    try {
                        accept(JSON.parse(stdout));
                    } catch (parseError) {
                        reject(parseError);
                    }
                },
            );
        }).catch(error => {
            invalidate();
            throw error;
        });
        return bundlePromise;
    };

    const serve = async (request, response, next) => {
        const pathname = (request.url || '/').split(/[?#]/, 1)[0];
        const bundleKey = LOCAL_COVERAGE_ROUTES.get(pathname);
        if (!bundleKey) return next();
        if (!isLocalRequest(request)) {
            response.statusCode = 404;
            return response.end();
        }
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            response.statusCode = 405;
            response.setHeader('Allow', 'GET, HEAD');
            return response.end();
        }
        try {
            const bundle = await getBundle();
            const payload = JSON.stringify(bundle[bundleKey]);
            response.statusCode = 200;
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            response.setHeader('Cache-Control', 'no-store');
            if (request.method === 'HEAD') return response.end();
            return response.end(payload);
        } catch (error) {
            response.statusCode = 500;
            response.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return response.end(error instanceof Error ? error.message : 'Failed to build live coverage data.');
        }
    };

    return {
        name: 'edugraph-local-coverage',
        configureServer(server) {
            server.watcher.add(LOCAL_COVERAGE_WATCH_ROOTS);
            server.watcher.on('all', (_event, changedPath) => {
                const normalizedPath = resolve(changedPath);
                if (LOCAL_COVERAGE_WATCH_ROOTS.some(root =>
                    normalizedPath === root || normalizedPath.startsWith(`${root}${sep}`))) invalidate();
            });
            server.middlewares.use(serve);
        },
        configurePreviewServer(server) {
            server.middlewares.use(serve);
        },
    };
}

function localDatasetPlugin() {
    let bundlePromise;
    const invalidate = () => {
        bundlePromise = undefined;
    };
    const getBundle = () => {
        bundlePromise ??= new Promise((accept, reject) => {
            execFile(
                process.execPath,
                [VITE_NODE_WORKER, LOCAL_ASSET_INDEX_SCRIPT],
                { cwd: import.meta.dirname, maxBuffer: 50 * 1024 * 1024 },
                (error, stdout, stderr) => {
                    if (error) {
                        reject(new Error(stderr.trim() || error.message));
                        return;
                    }
                    try {
                        const bundle = JSON.parse(stdout);
                        accept({
                            index: bundle.index,
                            localAssets: new Map(bundle.localAssets),
                        });
                    } catch (parseError) {
                        reject(parseError);
                    }
                },
            );
        }).catch(error => {
            invalidate();
            throw error;
        });
        return bundlePromise;
    };

    const serve = async (request, response, next) => {
        const rawPathname = (request.url || '/').split(/[?#]/, 1)[0];
        const servesIndex = rawPathname === LOCAL_ASSET_INDEX_ROUTE;
        const servesImage = rawPathname.startsWith(LOCAL_DATASET_ROUTE);
        if (!servesIndex && !servesImage) return next();

        if (!isLocalRequest(request)) {
            response.statusCode = 404;
            return response.end();
        }

        if (request.method !== 'GET' && request.method !== 'HEAD') {
            response.statusCode = 405;
            response.setHeader('Allow', 'GET, HEAD');
            return response.end();
        }

        try {
            const bundle = await getBundle();
            if (servesIndex) {
                const payload = JSON.stringify(bundle.index);
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json; charset=utf-8');
                response.setHeader('Cache-Control', 'no-store');
                if (request.method === 'HEAD') return response.end();
                return response.end(payload);
            }

            const key = localAssetRequestKey(rawPathname.slice(LOCAL_DATASET_ROUTE.length));
            const assetPath = key ? bundle.localAssets.get(key) : undefined;
            if (!assetPath || !existsSync(assetPath)) {
                response.statusCode = 404;
                return response.end();
            }

            const asset = statSync(assetPath);
            if (!asset.isFile()) {
                response.statusCode = 404;
                return response.end();
            }

            response.statusCode = 200;
            response.setHeader('Content-Type', 'image/png');
            response.setHeader('Content-Length', asset.size);
            response.setHeader('Cache-Control', 'no-store');
            if (request.method === 'HEAD') return response.end();
            return createReadStream(assetPath).pipe(response);
        } catch (error) {
            response.statusCode = 500;
            response.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return response.end(error instanceof Error ? error.message : 'Failed to build local asset index.');
        }
    };

    return {
        name: 'edugraph-local-dataset',
        configureServer(server) {
            server.watcher.add(LOCAL_ASSET_WATCH_ROOTS);
            server.watcher.on('all', (_event, changedPath) => {
                const normalizedPath = resolve(changedPath);
                if (LOCAL_ASSET_WATCH_ROOTS.some(root =>
                    normalizedPath === root || normalizedPath.startsWith(`${root}${sep}`))) invalidate();
            });
            server.middlewares.use(serve);
        },
        configurePreviewServer(server) {
            server.middlewares.use(serve);
        },
    };
}

function viewHeadPlugin() {
    return {
        name: 'edugraph-view-head',
        transformIndexHtml: {
            order: 'pre',
            handler(html) {
                if (!html.includes('{{>')) return html;

                const invocations = [...html.matchAll(VIEW_HEAD_INVOCATION)];
                if (invocations.length !== 1) {
                    throw new Error('Expected exactly one {{> head script=... }} invocation.');
                }

                const [, , script] = invocations[0];
                const head = readFileSync(VIEW_HEAD_PATH, 'utf8').replace('{{ script }}', script);
                return html.replace(invocations[0][0], head);
            }
        }
    };
}

export default defineConfig({
    // ✨ Set the project's root to the 'src' directory
    root: 'src',
    publicDir: '../public',
    server: {
        proxy: {
            '/coverage/latest': coverageProxy(),
            '/coverage/preview': coverageProxy(),
            '/dataset/asset-index.json': {
                target: COVERAGE_SITE,
                changeOrigin: true,
                secure: true,
            },
        },
    },
    build: {
        // ✨ Output files to a 'dist' directory at the project level (../)
        outDir: '../dist',
        emptyOutDir: true, // This is a good practice
        rollupOptions: {
            input: Object.fromEntries(
                // ✨ Find all HTML files within the new root ('src')
                globSync('./src/**/*.html', {exclude: ['./src/partials/**']}).map(file => [
                    // ✨ The key is now naturally relative to 'src'
                    // e.g., 'pages/about.html' -> 'pages/about'
                    // e.g., 'index.html' -> 'index'
                    relative(
                        'src',
                        file.slice(0, file.length - extname(file).length)
                    ),
                    // The value is the absolute path to the file
                    fileURLToPath(new URL(file, import.meta.url))
                ])
            ),
        },
    },
    plugins: [
        react(),
        tailwindcss(),
        viewHeadPlugin(),
        localCoveragePlugin(),
        localDatasetPlugin(),
    ],
    test: {
        coverage: {
            provider: 'v8',
            include: ['generators/**/generator.ts'],
            reporter: ['text', 'json-summary'],
            reportsDirectory: '../coverage'
        }
    }
});

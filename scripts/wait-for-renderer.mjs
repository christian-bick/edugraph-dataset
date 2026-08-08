const [url, timeoutValue] = process.argv.slice(2);
const timeoutMs = Number(timeoutValue);
if (!url || !Number.isFinite(timeoutMs) || timeoutMs < 1) {
    throw new Error('Usage: node wait-for-renderer.mjs <url> <timeout-ms>');
}

const deadline = Date.now() + timeoutMs;
let lastError;
while (Date.now() < deadline) {
    try {
        const response = await fetch(url);
        if (response.ok) process.exit(0);
        lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
        lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
}
throw new Error(`Renderer did not become ready at ${url}: ${lastError}`);


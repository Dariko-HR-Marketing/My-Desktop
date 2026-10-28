import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createStore } from './store/index.js';

const config = loadConfig();
const store = await createStore(config);
const app = await buildApp({ config, store, logger: true });

await app.listen({ port: config.PORT, host: config.HOST });

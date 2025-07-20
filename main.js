const GeminiApp = require('./src/core/GeminiApp');

const app = new GeminiApp();
app.start().catch(console.error);
import { app } from './app';

const port = process.env.SEARCH_ORCHESTRATOR_PORT ?? 3002;
app.listen(port, () => {
  console.log(`search-orchestrator running on port ${port}`);
});

import { app } from './app';

const port = process.env.AI_SERVICE_PORT ?? 3004;
app.listen(port, () => {
  console.log(`ai-service running on port ${port}`);
});

import { app } from './app';

const port = process.env.FAVORITES_SERVICE_PORT ?? 3003;
app.listen(port, () => {
  console.log(`favorites-service running on port ${port}`);
});

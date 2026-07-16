import { createApp } from './app';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`[Household OS API] Running on port ${PORT}`);
    console.log(`[Household OS API] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

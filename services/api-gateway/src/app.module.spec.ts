import { Test } from '@nestjs/testing';

import { AppModule } from './app.module';

describe('AppModule', () => {
  it('bootstraps the gateway module graph', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.close();
  });
});

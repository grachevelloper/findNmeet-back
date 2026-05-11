import { Test } from '@nestjs/testing';

import { HealthController } from '../src/health/health.controller';

describe('HealthController', () => {
  it('returns service health', () => {
    const controller = new HealthController();

    expect(controller.check()).toEqual({ status: 'ok', service: 'favorites-service' });
  });

  it('is registered in a testing module', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    expect(moduleRef.get(HealthController)).toBeInstanceOf(HealthController);
  });
});

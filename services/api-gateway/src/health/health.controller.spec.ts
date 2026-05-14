import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns api-gateway health payload', () => {
    const controller = new HealthController();

    expect(controller.check()).toEqual({
      status: 'ok',
      service: 'api-gateway',
    });
  });
});

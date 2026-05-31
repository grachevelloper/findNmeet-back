import { contractsProtoRoot } from './contracts-proto-root';

describe('contractsProtoRoot', () => {
  it('resolves proto directory relative to ai-service source files', () => {
    const root = contractsProtoRoot('/workspace/services/ai-service/src/search-query/infrastracture/auth');

    expect(root).toBe('/workspace/contracts/proto');
  });
});

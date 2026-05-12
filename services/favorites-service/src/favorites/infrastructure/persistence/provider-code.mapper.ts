import { FavoriteProvider } from '../../domain/models/favorite-provider';

const VK_PROVIDER_CODE = 1;

export function providerToCode(provider: FavoriteProvider): number {
  switch (provider) {
    case FavoriteProvider.VK:
      return VK_PROVIDER_CODE;
  }
}

export function providerFromCode(code: number): FavoriteProvider {
  if (code === VK_PROVIDER_CODE) {
    return FavoriteProvider.VK;
  }

  throw new Error(`Unsupported favorite provider code: ${code}`);
}

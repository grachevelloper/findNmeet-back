import { Metadata } from '@grpc/grpc-js';
import { DeleteFavoriteRequestSchema, GetFavoriteRequestSchema, RefreshFavoriteRequestSchema } from '@findnmeet/ts-types/favorites/v1';
import type { CreateFavoriteRequest, DeleteFavoriteRequest, GetFavoriteRequest, RefreshFavoriteRequest } from '@findnmeet/ts-types/favorites/v1';
import { FavoritesRepository } from '../../src/favorites/domain/ports/favorites.repository';
export declare const userId = "550e8400-e29b-41d4-a716-446655440000";
export declare function metadataWithUserId(currentUserId?: string): Metadata;
export declare function createFavoriteRequest(externalId: string, note?: string): CreateFavoriteRequest;
export declare function favoriteIdRequest<T extends GetFavoriteRequest | DeleteFavoriteRequest | RefreshFavoriteRequest>(schema: typeof GetFavoriteRequestSchema | typeof DeleteFavoriteRequestSchema | typeof RefreshFavoriteRequestSchema, favoriteId: string): T;
export declare function createRepositoryFake(): FavoritesRepository;
//# sourceMappingURL=favorites.d.ts.map
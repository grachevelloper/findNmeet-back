"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userId = void 0;
exports.metadataWithUserId = metadataWithUserId;
exports.createFavoriteRequest = createFavoriteRequest;
exports.favoriteIdRequest = favoriteIdRequest;
exports.createRepositoryFake = createRepositoryFake;
const protobuf_1 = require("@bufbuild/protobuf");
const grpc_js_1 = require("@grpc/grpc-js");
const v1_1 = require("@findnmeet/ts-types/favorites/v1");
const v1_2 = require("@findnmeet/ts-types/shared/v1");
exports.userId = '550e8400-e29b-41d4-a716-446655440000';
function metadataWithUserId(currentUserId = exports.userId) {
    const metadata = new grpc_js_1.Metadata();
    metadata.add('x-user-id', currentUserId);
    return metadata;
}
function createFavoriteRequest(externalId, note) {
    return (0, protobuf_1.create)(v1_1.CreateFavoriteRequestSchema, {
        provider: v1_2.Provider.VK,
        externalId,
        note,
    });
}
function favoriteIdRequest(schema, favoriteId) {
    return (0, protobuf_1.create)(schema, {
        favoriteId: (0, protobuf_1.create)(v1_2.UuidSchema, { value: favoriteId }),
    });
}
function createRepositoryFake() {
    const favorites = new Map();
    return {
        async findById(favoriteId) {
            return favorites.get(favoriteId);
        },
        async findDuplicateFavoriteId(ownerId, provider, externalId) {
            return [...favorites.values()].find((favorite) => favorite.ownerId === ownerId && favorite.provider === provider && favorite.externalId === externalId)?.id;
        },
        async listByOwner(ownerId, provider) {
            return [...favorites.values()]
                .filter((favorite) => favorite.ownerId === ownerId)
                .filter((favorite) => provider === undefined || favorite.provider === provider)
                .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
        },
        async save(favorite) {
            favorites.set(favorite.id, favorite);
        },
        async delete(favorite) {
            favorites.delete(favorite.id);
        },
    };
}
//# sourceMappingURL=favorites.js.map
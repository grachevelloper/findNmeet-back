export abstract class CurrentUserVkAccessTokenProvider {
  abstract getByUserId(userId: string): Promise<string>;
}

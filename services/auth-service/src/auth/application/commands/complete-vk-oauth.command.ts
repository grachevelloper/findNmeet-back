export type CompleteVkOAuthCommand = {
  code?: string;
  state?: string;
  redirectUri?: string;
  codeVerifier?: string;
  deviceId?: string;
};

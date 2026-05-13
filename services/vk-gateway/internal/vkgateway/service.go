package vkgateway

import (
	"context"
	"errors"
	"strconv"
	"strings"

	sharedv1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/shared/v1"
	vkv1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/vk/v1"
	exchangeoauthcodev1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/vk/v1/exchange_oauth_code"
	getprofilev1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/vk/v1/get_profile"
	searchprofilesv1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/vk/v1/search_profiles"
	"github.com/findnmeet/vk-gateway/internal/vkapi"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type VKClient interface {
	ExchangeOAuthCode(ctx context.Context, code string, redirectURI string) (string, *vkv1.VkOAuthTokens, error)
	GetProfile(ctx context.Context, lookup string, accessToken string) (*vkv1.VkProfile, error)
}

type Service struct {
	client VKClient
}

func NewService(client VKClient) *Service {
	return &Service{client: client}
}

func (s *Service) ExchangeOAuthCode(ctx context.Context, req *exchangeoauthcodev1.ExchangeOAuthCodeRequest) (*exchangeoauthcodev1.ExchangeOAuthCodeResponse, error) {
	code := strings.TrimSpace(req.GetCode())
	redirectURI := strings.TrimSpace(req.GetRedirectUri())
	if code == "" {
		return nil, status.Error(codes.InvalidArgument, "code is required")
	}
	if redirectURI == "" {
		return nil, status.Error(codes.InvalidArgument, "redirect_uri is required")
	}

	externalID, tokens, err := s.client.ExchangeOAuthCode(ctx, code, redirectURI)
	if err != nil {
		return nil, grpcError(err)
	}

	profile, err := s.client.GetProfile(ctx, externalID, tokens.GetAccessToken().GetValue())
	if err != nil {
		return nil, grpcError(err)
	}

	return &exchangeoauthcodev1.ExchangeOAuthCodeResponse{ExternalId: externalID, Tokens: tokens, Profile: profile}, nil
}

func (s *Service) GetProfile(ctx context.Context, req *getprofilev1.GetProfileRequest) (*getprofilev1.GetProfileResponse, error) {
	lookup, err := profileLookup(req.GetLookup())
	if err != nil {
		return nil, err
	}

	profile, err := s.client.GetProfile(ctx, lookup, sensitiveValue(req.GetAccessToken()))
	if err != nil {
		return nil, grpcError(err)
	}

	return &getprofilev1.GetProfileResponse{Profile: profile}, nil
}

func (s *Service) SearchProfiles(context.Context, *searchprofilesv1.SearchProfilesRequest) (*searchprofilesv1.SearchProfilesResponse, error) {
	return nil, status.Error(codes.Unimplemented, "SearchProfiles is not implemented yet")
}

func profileLookup(lookup *vkv1.VkProfileLookup) (string, error) {
	if lookup == nil {
		return "", status.Error(codes.InvalidArgument, "lookup is required")
	}

	switch value := lookup.GetValue().(type) {
	case *vkv1.VkProfileLookup_VkUserId:
		if value.VkUserId <= 0 {
			return "", status.Error(codes.InvalidArgument, "vk_user_id must be positive")
		}
		return strconv.FormatInt(value.VkUserId, 10), nil
	case *vkv1.VkProfileLookup_ScreenName:
		screenName := strings.TrimSpace(value.ScreenName)
		if screenName == "" {
			return "", status.Error(codes.InvalidArgument, "screen_name is required")
		}
		return screenName, nil
	default:
		return "", status.Error(codes.InvalidArgument, "lookup value is required")
	}
}

func sensitiveValue(value *sharedv1.SensitiveString) string {
	if value == nil {
		return ""
	}
	return value.GetValue()
}

func grpcError(err error) error {
	switch {
	case errors.Is(err, vkapi.ErrInvalidConfig):
		return status.Error(codes.FailedPrecondition, err.Error())
	case errors.Is(err, vkapi.ErrUnauthorized):
		return status.Error(codes.Unauthenticated, "vk authorization failed")
	case errors.Is(err, vkapi.ErrNotFound):
		return status.Error(codes.NotFound, "vk profile not found")
	default:
		return status.Error(codes.Unavailable, "vk gateway upstream request failed")
	}
}

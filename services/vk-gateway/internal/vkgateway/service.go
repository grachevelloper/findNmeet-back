package vkgateway

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	sharedv1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/shared/v1"
	vkv1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/vk/v1"
	"github.com/findnmeet/vk-gateway/internal/vkapi"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type VKClient interface {
	ExchangeOAuthCode(ctx context.Context, code string, redirectURI string, codeVerifier string, state string, deviceID string) (string, *vkv1.VkOAuthTokens, error)
	GetCurrentProfile(ctx context.Context, accessToken string) (*vkv1.VkProfile, error)
	GetProfile(ctx context.Context, lookup string, accessToken string) (*vkv1.VkProfile, error)
	SearchProfiles(ctx context.Context, filters *vkv1.VkSearchFilters, page *sharedv1.PageRequest, accessToken string) (*vkv1.VkSearchResult, *sharedv1.PageResponse, error)
}

type Service struct {
	client VKClient
}

func NewService(client VKClient) *Service {
	return &Service{client: client}
}

func (s *Service) ExchangeOAuthCode(ctx context.Context, req *vkv1.ExchangeOAuthCodeRequest) (*vkv1.ExchangeOAuthCodeResponse, error) {
	code := strings.TrimSpace(req.GetCode())
	redirectURI := strings.TrimSpace(req.GetRedirectUri())
	if code == "" {
		return nil, status.Error(codes.InvalidArgument, "code is required")
	}
	if redirectURI == "" {
		return nil, status.Error(codes.InvalidArgument, "redirect_uri is required")
	}

	externalID, tokens, err := s.client.ExchangeOAuthCode(
		ctx,
		code,
		redirectURI,
		strings.TrimSpace(req.GetCodeVerifier()),
		strings.TrimSpace(req.GetState()),
		strings.TrimSpace(req.GetDeviceId()),
	)
	if err != nil {
		return nil, grpcError(err)
	}

	profile, err := s.client.GetProfile(ctx, externalID, tokens.GetAccessToken().GetValue())
	if err != nil {
		return nil, grpcError(err)
	}

	return &vkv1.ExchangeOAuthCodeResponse{ExternalId: externalID, Tokens: tokens, Profile: profile}, nil
}

func (s *Service) GetProfile(ctx context.Context, req *vkv1.GetProfileRequest) (*vkv1.GetProfileResponse, error) {
	lookup, err := profileLookup(req.GetLookup())
	if err != nil {
		return nil, err
	}

	profile, err := s.client.GetProfile(ctx, lookup, sensitiveValue(req.GetAccessToken()))
	if err != nil {
		return nil, grpcError(err)
	}

	return &vkv1.GetProfileResponse{Profile: profile}, nil
}

func (s *Service) GetCurrentProfile(ctx context.Context, req *vkv1.GetCurrentProfileRequest) (*vkv1.GetCurrentProfileResponse, error) {
	profile, err := s.client.GetCurrentProfile(ctx, sensitiveValue(req.GetAccessToken()))
	if err != nil {
		return nil, grpcError(err)
	}

	return &vkv1.GetCurrentProfileResponse{Profile: profile}, nil
}

func (s *Service) RefreshOAuthTokens(context.Context, *vkv1.RefreshOAuthTokensRequest) (*vkv1.RefreshOAuthTokensResponse, error) {
	return nil, status.Error(codes.Unimplemented, "vk oauth token refresh is not implemented")
}

func (s *Service) SearchProfiles(ctx context.Context, req *vkv1.SearchProfilesRequest) (*vkv1.SearchProfilesResponse, error) {
	if req.GetFilters() == nil {
		return nil, status.Error(codes.InvalidArgument, "filters is required")
	}

	accessToken := sensitiveValue(req.GetAccessToken())
	result, page, err := s.client.SearchProfiles(ctx, req.GetFilters(), req.GetPage(), accessToken)
	if err != nil {
		currentProfile, currentProfileErr := s.client.GetCurrentProfile(ctx, accessToken)
		details := fmt.Sprintf("vk gateway upstream request failed: users.search failed: %v", err)
		if currentProfileErr != nil {
			details = fmt.Sprintf("%s; users.get self-check failed: %v", details, currentProfileErr)
		} else {
			details = fmt.Sprintf(
				"%s; users.get self-check ok: vk_user_id=%d screen_name=%s",
				details,
				currentProfile.GetVkUserId(),
				currentProfile.GetScreenName(),
			)
		}
		return nil, status.Error(codes.Unavailable, details)
	}

	return &vkv1.SearchProfilesResponse{
		Result: result,
		Page:   page,
	}, nil
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
		return status.Errorf(codes.Unauthenticated, "vk authorization failed: %v", err)
	case errors.Is(err, vkapi.ErrNotFound):
		return status.Error(codes.NotFound, "vk profile not found")
	default:
		return status.Error(codes.Unavailable, "vk gateway upstream request failed")
	}
}

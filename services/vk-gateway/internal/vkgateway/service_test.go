package vkgateway

import (
	"context"
	"errors"
	"testing"
	"time"

	sharedv1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/shared/v1"
	vkv1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/vk/v1"
	"github.com/findnmeet/vk-gateway/internal/vkapi"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/durationpb"
)

type fakeVKClient struct {
	exchangedCode        string
	exchangedRedirectURI string
	exchangedVerifier    string
	profileLookup        string
	profileAccessToken   string
	currentAccessToken   string
	refreshToken         string
	refreshDeviceID      string
	exchangeErr          error
	profileErr           error
	refreshErr           error
}

func (f *fakeVKClient) ExchangeOAuthCode(_ context.Context, code string, redirectURI string, codeVerifier string) (string, *vkv1.VkOAuthTokens, error) {
	f.exchangedCode = code
	f.exchangedRedirectURI = redirectURI
	f.exchangedVerifier = codeVerifier
	if f.exchangeErr != nil {
		return "", nil, f.exchangeErr
	}

	return "123", &vkv1.VkOAuthTokens{
		AccessToken:  &sharedv1.SensitiveString{Value: "vk-access-token"},
		RefreshToken: &sharedv1.SensitiveString{Value: "vk-refresh-token"},
		ExpiresIn:    durationpb.New(time.Hour),
	}, nil
}

func (f *fakeVKClient) GetProfile(_ context.Context, lookup string, accessToken string) (*vkv1.VkProfile, error) {
	f.profileLookup = lookup
	f.profileAccessToken = accessToken
	if f.profileErr != nil {
		return nil, f.profileErr
	}

	return &vkv1.VkProfile{VkUserId: 123, FirstName: "Ivan", LastName: "Ivanov", ScreenName: "ivan"}, nil
}

func (f *fakeVKClient) GetCurrentProfile(_ context.Context, accessToken string) (*vkv1.VkProfile, error) {
	f.currentAccessToken = accessToken
	if f.profileErr != nil {
		return nil, f.profileErr
	}

	return &vkv1.VkProfile{VkUserId: 123, FirstName: "Ivan", LastName: "Ivanov", ScreenName: "ivan"}, nil
}

func (f *fakeVKClient) RefreshOAuthTokens(_ context.Context, refreshToken string, deviceID string) (*vkv1.VkOAuthTokens, error) {
	f.refreshToken = refreshToken
	f.refreshDeviceID = deviceID
	if f.refreshErr != nil {
		return nil, f.refreshErr
	}

	return &vkv1.VkOAuthTokens{
		AccessToken:  &sharedv1.SensitiveString{Value: "fresh-access-token"},
		RefreshToken: &sharedv1.SensitiveString{Value: "fresh-refresh-token"},
		ExpiresIn:    durationpb.New(time.Hour),
	}, nil
}

func TestExchangeOAuthCodeReturnsTokensAndProfile(t *testing.T) {
	client := &fakeVKClient{}
	service := NewService(client)

	response, err := service.ExchangeOAuthCode(context.Background(), &vkv1.ExchangeOAuthCodeRequest{
		Code:        "oauth-code",
		RedirectUri: "http://localhost:3000/auth/vk/callback",
	})
	if err != nil {
		t.Fatalf("ExchangeOAuthCode returned error: %v", err)
	}

	if client.exchangedCode != "oauth-code" {
		t.Fatalf("expected oauth-code, got %q", client.exchangedCode)
	}
	if client.profileLookup != "123" {
		t.Fatalf("expected profile lookup 123, got %q", client.profileLookup)
	}
	if client.profileAccessToken != "vk-access-token" {
		t.Fatalf("expected profile access token to come from token exchange")
	}
	if response.GetExternalId() != "123" {
		t.Fatalf("expected external id 123, got %q", response.GetExternalId())
	}
	if response.GetProfile().GetFirstName() != "Ivan" {
		t.Fatalf("expected profile first name Ivan, got %q", response.GetProfile().GetFirstName())
	}
}

func TestGetProfileAcceptsVkUserIDLookup(t *testing.T) {
	client := &fakeVKClient{}
	service := NewService(client)

	response, err := service.GetProfile(context.Background(), &vkv1.GetProfileRequest{
		Lookup:      &vkv1.VkProfileLookup{Value: &vkv1.VkProfileLookup_VkUserId{VkUserId: 123}},
		AccessToken: &sharedv1.SensitiveString{Value: "vk-access-token"},
	})
	if err != nil {
		t.Fatalf("GetProfile returned error: %v", err)
	}

	if client.profileLookup != "123" {
		t.Fatalf("expected lookup 123, got %q", client.profileLookup)
	}
	if response.GetProfile().GetScreenName() != "ivan" {
		t.Fatalf("expected screen name ivan, got %q", response.GetProfile().GetScreenName())
	}
}

func TestGetCurrentProfileUsesSuppliedAccessToken(t *testing.T) {
	client := &fakeVKClient{}
	service := NewService(client)

	response, err := service.GetCurrentProfile(context.Background(), &vkv1.GetCurrentProfileRequest{
		AccessToken: &sharedv1.SensitiveString{Value: "vk-access-token"},
	})
	if err != nil {
		t.Fatalf("GetCurrentProfile returned error: %v", err)
	}

	if client.currentAccessToken != "vk-access-token" {
		t.Fatalf("expected current profile access token to be forwarded")
	}
	if response.GetProfile().GetVkUserId() != 123 {
		t.Fatalf("expected vk user id 123, got %d", response.GetProfile().GetVkUserId())
	}
}

func TestExchangeOAuthCodeValidatesCode(t *testing.T) {
	service := NewService(&fakeVKClient{})

	_, err := service.ExchangeOAuthCode(context.Background(), &vkv1.ExchangeOAuthCodeRequest{
		RedirectUri: "http://localhost:3000/auth/vk/callback",
	})

	if status.Code(err) != codes.InvalidArgument {
		t.Fatalf("expected InvalidArgument, got %v", status.Code(err))
	}
}

func TestVKClientErrorsMapToGrpcCodes(t *testing.T) {
	service := NewService(&fakeVKClient{profileErr: vkapi.ErrUnauthorized})

	_, err := service.GetProfile(context.Background(), &vkv1.GetProfileRequest{
		Lookup:      &vkv1.VkProfileLookup{Value: &vkv1.VkProfileLookup_ScreenName{ScreenName: "ivan"}},
		AccessToken: &sharedv1.SensitiveString{Value: "bad-token"},
	})

	if status.Code(err) != codes.Unauthenticated {
		t.Fatalf("expected Unauthenticated, got %v", status.Code(err))
	}
}

func TestUnknownErrorsMapToUnavailable(t *testing.T) {
	service := NewService(&fakeVKClient{profileErr: errors.New("network failed")})

	_, err := service.GetProfile(context.Background(), &vkv1.GetProfileRequest{
		Lookup:      &vkv1.VkProfileLookup{Value: &vkv1.VkProfileLookup_ScreenName{ScreenName: "ivan"}},
		AccessToken: &sharedv1.SensitiveString{Value: "vk-access-token"},
	})

	if status.Code(err) != codes.Unavailable {
		t.Fatalf("expected Unavailable, got %v", status.Code(err))
	}
}

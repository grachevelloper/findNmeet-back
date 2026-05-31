package vkmock

import (
	"context"
	"testing"

	sharedv1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/shared/v1"
	vkv1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/vk/v1"
)

func TestSearchProfilesReturnsLargePaginatedCatalog(t *testing.T) {
	client := NewClient()

	result, page, err := client.SearchProfiles(context.Background(), &vkv1.VkSearchFilters{}, &sharedv1.PageRequest{
		PageSize: 25,
	}, "ignored-token")
	if err != nil {
		t.Fatalf("SearchProfiles returned error: %v", err)
	}

	if got := len(result.GetProfiles()); got != 25 {
		t.Fatalf("expected 25 profiles on first page, got %d", got)
	}
	if result.GetTotalCount() <= 100 {
		t.Fatalf("expected catalog larger than 100 profiles, got %d", result.GetTotalCount())
	}
	if page.GetNextPageToken() != "25" {
		t.Fatalf("expected next page token 25, got %q", page.GetNextPageToken())
	}
	if result.GetProfiles()[0].GetScreenName() == "" {
		t.Fatalf("expected screen name to be set")
	}
}

func TestSearchProfilesAppliesStructuredFilters(t *testing.T) {
	client := NewClient()

	result, _, err := client.SearchProfiles(context.Background(), &vkv1.VkSearchFilters{
		Query:      "анна",
		City:       &vkv1.VkReference{Id: 1, Title: "Москва"},
		University: &vkv1.VkReference{Id: 101, Title: "МГУ"},
		AgeFrom:    func() *int32 { v := int32(20); return &v }(),
		AgeTo:      func() *int32 { v := int32(32); return &v }(),
		Relation:   vkv1.VkRelationStatus_VK_RELATION_STATUS_SINGLE,
		OnlineOnly: true,
	}, &sharedv1.PageRequest{PageSize: 50}, "ignored-token")
	if err != nil {
		t.Fatalf("SearchProfiles returned error: %v", err)
	}

	if result.GetTotalCount() == 0 {
		t.Fatalf("expected filtered profiles, got 0")
	}

	for _, profile := range result.GetProfiles() {
		if profile.GetFirstName() != "Анна" {
			t.Fatalf("expected first name Анна, got %q", profile.GetFirstName())
		}
		if profile.GetCity().GetId() != 1 {
			t.Fatalf("expected city id 1, got %d", profile.GetCity().GetId())
		}
		if profile.GetUniversity().GetId() != 101 {
			t.Fatalf("expected university id 101, got %d", profile.GetUniversity().GetId())
		}
		if age := profile.GetAge(); age < 20 || age > 32 {
			t.Fatalf("expected age in range 20..32, got %d", age)
		}
		if profile.GetRelation() != vkv1.VkRelationStatus_VK_RELATION_STATUS_SINGLE {
			t.Fatalf("expected relation SINGLE, got %v", profile.GetRelation())
		}
		if profile.GetOnlineStatus() != vkv1.VkOnlineStatus_VK_ONLINE_STATUS_ONLINE {
			t.Fatalf("expected online status ONLINE, got %v", profile.GetOnlineStatus())
		}
	}
}

func TestSearchProfilesReturnsMoscowAnnaDemoCatalog(t *testing.T) {
	client := NewClient()

	result, page, err := client.SearchProfiles(context.Background(), &vkv1.VkSearchFilters{
		Query: "Все Анны из Москвы",
	}, &sharedv1.PageRequest{PageSize: 20}, "ignored-token")
	if err != nil {
		t.Fatalf("SearchProfiles returned error: %v", err)
	}

	if result.GetTotalCount() != 41 {
		t.Fatalf("expected 41 Moscow Anna demo profiles, got %d", result.GetTotalCount())
	}
	if got := len(result.GetProfiles()); got != 20 {
		t.Fatalf("expected first page to contain 20 profiles, got %d", got)
	}
	if page.GetNextPageToken() != "20" {
		t.Fatalf("expected next page token 20, got %q", page.GetNextPageToken())
	}

	for _, profile := range result.GetProfiles() {
		if profile.GetFirstName() != "Анна" {
			t.Fatalf("expected first name Анна, got %q", profile.GetFirstName())
		}
		if profile.GetCity().GetTitle() != "Москва" {
			t.Fatalf("expected city Москва, got %q", profile.GetCity().GetTitle())
		}
		if profile.GetScreenName() == "" || profile.GetScreenName() == "id1" {
			t.Fatalf("expected realistic fake screen name, got %q", profile.GetScreenName())
		}
		if profile.GetPhotoUrl() == "" || profile.GetPhotoUrl() == "https://vk.com/images/camera_200.png" {
			t.Fatalf("expected non-default portrait photo URL, got %q", profile.GetPhotoUrl())
		}
	}
}

func TestSearchProfilesReturnsMoscowAnnaDemoCatalogForParsedAiFilters(t *testing.T) {
	client := NewClient()

	result, _, err := client.SearchProfiles(context.Background(), &vkv1.VkSearchFilters{
		Query: "Анны",
		City:  &vkv1.VkReference{Id: 1, Title: "Москва"},
	}, &sharedv1.PageRequest{PageSize: 50}, "ignored-token")
	if err != nil {
		t.Fatalf("SearchProfiles returned error: %v", err)
	}

	if result.GetTotalCount() != 41 {
		t.Fatalf("expected 41 Moscow Anna demo profiles, got %d", result.GetTotalCount())
	}
}

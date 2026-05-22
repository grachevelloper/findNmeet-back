package vkapi

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	sharedv1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/shared/v1"
	vkv1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/vk/v1"
)

func TestSearchProfilesBuildsVKQueryAndPagination(t *testing.T) {
	var gotQuery map[string]string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotQuery = map[string]string{}
		for key := range r.URL.Query() {
			gotQuery[key] = r.URL.Query().Get(key)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"response":{"count":21,"items":[{"id":7,"first_name":"Anna","last_name":"Ivanova","screen_name":"anna","online":1,"relation":1}]}}`))
	}))
	defer server.Close()

	client := NewClient(Config{
		APIURL:     server.URL,
		APIVersion: "5.199",
		Timeout:    0,
	})

	result, page, err := client.SearchProfiles(context.Background(), &vkv1.VkSearchFilters{
		Query:      "anna",
		City:       &vkv1.VkReference{Id: 1, Title: "Moscow"},
		AgeFrom:    func() *int32 { v := int32(20); return &v }(),
		Relation:   vkv1.VkRelationStatus_VK_RELATION_STATUS_SINGLE,
		OnlineOnly: true,
	}, &sharedv1.PageRequest{PageSize: 20, PageToken: "0"}, "vk-token")
	if err != nil {
		t.Fatalf("SearchProfiles returned error: %v", err)
	}

	if gotQuery["q"] != "anna" || gotQuery["city"] != "1" || gotQuery["age_from"] != "20" {
		t.Fatalf("unexpected query mapping: %#v", gotQuery)
	}
	if gotQuery["status"] != "1" || gotQuery["online"] != "1" || gotQuery["access_token"] != "vk-token" {
		t.Fatalf("unexpected auth/filter params: %#v", gotQuery)
	}
	if result.GetProfiles()[0].GetScreenName() != "anna" {
		t.Fatalf("expected profile anna, got %q", result.GetProfiles()[0].GetScreenName())
	}
	if page.GetNextPageToken() != "20" {
		t.Fatalf("expected next page token 20, got %q", page.GetNextPageToken())
	}
}

func TestSearchProfilesRejectsInvalidPageToken(t *testing.T) {
	client := NewClient(Config{
		APIURL:     "https://example.invalid",
		APIVersion: "5.199",
	})

	_, _, err := client.SearchProfiles(context.Background(), &vkv1.VkSearchFilters{}, &sharedv1.PageRequest{
		PageToken: "bad-token",
	}, "vk-token")
	if err == nil || err.Error() != "invalid page token" {
		t.Fatalf("expected invalid page token error, got %v", err)
	}
}

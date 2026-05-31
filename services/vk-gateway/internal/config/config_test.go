package config

import "testing"

func TestFromEnvReadsMockSearchFlag(t *testing.T) {
	t.Setenv("USE_MOCK_VK_SEARCH", "true")

	cfg := FromEnv()

	if !cfg.UseMockVKSearch {
		t.Fatalf("expected UseMockVKSearch to be true")
	}
}

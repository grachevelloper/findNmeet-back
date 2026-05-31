package config

import (
	"os"
	"time"
)

type Config struct {
	GRPCAddress     string
	HTTPAddress     string
	VKAppID         string
	VKAppSecret     string
	VKAPIVersion    string
	VKOAuthURL      string
	VKAPIURL        string
	HTTPTimeout     time.Duration
	UseMockVKSearch bool
}

func FromEnv() Config {
	return Config{
		GRPCAddress:     env("VK_GATEWAY_GRPC_URL", "0.0.0.0:50054"),
		HTTPAddress:     ":" + env("VK_GATEWAY_PORT", "8080"),
		VKAppID:         os.Getenv("VK_APP_ID"),
		VKAppSecret:     os.Getenv("VK_APP_SECRET"),
		VKAPIVersion:    env("VK_API_VERSION", "5.199"),
		VKOAuthURL:      env("VK_OAUTH_URL", "https://id.vk.ru"),
		VKAPIURL:        env("VK_API_URL", "https://api.vk.com"),
		HTTPTimeout:     10 * time.Second,
		UseMockVKSearch: os.Getenv("USE_MOCK_VK_SEARCH") == "true",
	}
}

func env(name, fallback string) string {
	value := os.Getenv(name)
	if value == "" {
		return fallback
	}
	return value
}

package vkapi

import (
	"context"
	"net/http"
	"net/url"
)

func buildURL(base string, path string, mutate func(url.Values)) (string, error) {
	endpoint, err := url.Parse(base + path)
	if err != nil {
		return "", err
	}

	query := endpoint.Query()
	mutate(query)
	endpoint.RawQuery = query.Encode()

	return endpoint.String(), nil
}

func newGetRequest(ctx context.Context, rawURL string) (*http.Request, error) {
	return http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
}

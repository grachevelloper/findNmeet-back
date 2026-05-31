package vkapi

import (
	"context"
	"net/url"
	"net/http"
	"strings"
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

func newPostFormRequest(ctx context.Context, rawURL string, form url.Values) (*http.Request, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, rawURL, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}

	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	return request, nil
}

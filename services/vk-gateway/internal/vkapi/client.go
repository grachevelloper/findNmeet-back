package vkapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	sharedv1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/shared/v1"
	vkv1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/vk/v1"
	"google.golang.org/protobuf/types/known/durationpb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

var (
	ErrInvalidConfig = errors.New("invalid vk api config")
	ErrUnauthorized  = errors.New("vk authorization failed")
	ErrNotFound      = errors.New("vk profile not found")
)

type Client struct {
	httpClient *http.Client
	appID      string
	appSecret  string
	apiVersion string
	oauthURL   string
	apiURL     string
}

type Config struct {
	AppID      string
	AppSecret  string
	APIVersion string
	OAuthURL   string
	APIURL     string
	Timeout    time.Duration
}

func NewClient(cfg Config) *Client {
	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 10 * time.Second
	}

	return &Client{
		httpClient: &http.Client{Timeout: timeout},
		appID:      cfg.AppID,
		appSecret:  cfg.AppSecret,
		apiVersion: cfg.APIVersion,
		oauthURL:   strings.TrimRight(cfg.OAuthURL, "/"),
		apiURL:     strings.TrimRight(cfg.APIURL, "/"),
	}
}

func (c *Client) ExchangeOAuthCode(ctx context.Context, code string, redirectURI string, codeVerifier string) (string, *vkv1.VkOAuthTokens, error) {
	if c.appID == "" || c.appSecret == "" {
		return "", nil, fmt.Errorf("%w: VK_APP_ID and VK_APP_SECRET are required", ErrInvalidConfig)
	}

	endpoint, err := buildURL(c.oauthURL, "/access_token", func(query url.Values) {
		query.Set("client_id", c.appID)
		query.Set("client_secret", c.appSecret)
		query.Set("redirect_uri", redirectURI)
		query.Set("code", code)
		if codeVerifier != "" {
			query.Set("code_verifier", codeVerifier)
		}
	})
	if err != nil {
		return "", nil, err
	}

	req, err := newGetRequest(ctx, endpoint)
	if err != nil {
		return "", nil, err
	}

	var payload oauthResponse
	if err := c.doJSON(req, &payload); err != nil {
		return "", nil, err
	}
	if payload.Error != "" {
		return "", nil, vkOAuthError(payload.Error, payload.ErrorDescription)
	}
	if payload.AccessToken == "" || payload.UserID == 0 {
		return "", nil, ErrUnauthorized
	}

	tokens := &vkv1.VkOAuthTokens{
		AccessToken:  &sharedv1.SensitiveString{Value: payload.AccessToken},
		RefreshToken: &sharedv1.SensitiveString{Value: payload.RefreshToken},
		ExpiresIn:    durationpb.New(time.Duration(payload.ExpiresIn) * time.Second),
	}

	return strconv.FormatInt(payload.UserID, 10), tokens, nil
}

func (c *Client) GetProfile(ctx context.Context, lookup string, accessToken string) (*vkv1.VkProfile, error) {
	if accessToken == "" {
		return nil, ErrUnauthorized
	}

	endpoint, err := buildUsersGetURL(c.apiURL, c.apiVersion, accessToken, func(query url.Values) {
		query.Set("user_ids", lookup)
	})
	if err != nil {
		return nil, err
	}

	req, err := newGetRequest(ctx, endpoint)
	if err != nil {
		return nil, err
	}

	var payload usersGetResponse
	if err := c.doJSON(req, &payload); err != nil {
		return nil, err
	}
	if payload.Error != nil {
		return nil, vkAPIError(payload.Error)
	}
	if len(payload.Response) == 0 {
		return nil, ErrNotFound
	}

	return profileFromVK(payload.Response[0]), nil
}

func (c *Client) GetCurrentProfile(ctx context.Context, accessToken string) (*vkv1.VkProfile, error) {
	if accessToken == "" {
		return nil, ErrUnauthorized
	}

	endpoint, err := buildUsersGetURL(c.apiURL, c.apiVersion, accessToken, nil)
	if err != nil {
		return nil, err
	}

	req, err := newGetRequest(ctx, endpoint)
	if err != nil {
		return nil, err
	}

	var payload usersGetResponse
	if err := c.doJSON(req, &payload); err != nil {
		return nil, err
	}
	if payload.Error != nil {
		return nil, vkAPIError(payload.Error)
	}
	if len(payload.Response) == 0 {
		return nil, ErrNotFound
	}

	return profileFromVK(payload.Response[0]), nil
}

func (c *Client) RefreshOAuthTokens(context.Context, string, string) (*vkv1.VkOAuthTokens, error) {
	return nil, fmt.Errorf("vk oauth token refresh is not implemented yet")
}

func (c *Client) doJSON(req *http.Request, target any) error {
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		return ErrUnauthorized
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("vk http status %d", resp.StatusCode)
	}

	return json.NewDecoder(resp.Body).Decode(target)
}

type oauthResponse struct {
	AccessToken      string `json:"access_token"`
	RefreshToken     string `json:"refresh_token"`
	ExpiresIn        int64  `json:"expires_in"`
	UserID           int64  `json:"user_id"`
	Error            string `json:"error"`
	ErrorDescription string `json:"error_description"`
}

type usersGetResponse struct {
	Response []vkUser `json:"response"`
	Error    *vkError `json:"error"`
}

type vkError struct {
	Code    int    `json:"error_code"`
	Message string `json:"error_msg"`
}

type vkReference struct {
	ID    int64  `json:"id"`
	Title string `json:"title"`
}

type vkLastSeen struct {
	Time int64 `json:"time"`
}

type vkEducation struct {
	University     int64  `json:"university"`
	UniversityName string `json:"university_name"`
	Faculty        int64  `json:"faculty"`
	FacultyName    string `json:"faculty_name"`
	Graduation     int32  `json:"graduation"`
}

type vkUser struct {
	ID                     int64        `json:"id"`
	FirstName              string       `json:"first_name"`
	LastName               string       `json:"last_name"`
	ScreenName             string       `json:"screen_name"`
	PhotoURL               string       `json:"photo_200"`
	City                   *vkReference `json:"city"`
	Country                *vkReference `json:"country"`
	HomeTown               string       `json:"home_town"`
	BDate                  string       `json:"bdate"`
	Online                 int          `json:"online"`
	LastSeen               *vkLastSeen  `json:"last_seen"`
	Relation               int32        `json:"relation"`
	IsClosed               bool         `json:"is_closed"`
	CanWritePrivateMessage *int32       `json:"can_write_private_message"`
	vkEducation
}

func buildUsersGetURL(apiURL string, apiVersion string, accessToken string, mutate func(url.Values)) (string, error) {
	return buildURL(apiURL, "/method/users.get", func(query url.Values) {
		if mutate != nil {
			mutate(query)
		}
		query.Set("fields", "screen_name,photo_200,city,country,home_town,education,graduation,bdate,online,last_seen,relation,can_write_private_message,is_closed")
		query.Set("access_token", accessToken)
		query.Set("v", apiVersion)
	})
}

func profileFromVK(user vkUser) *vkv1.VkProfile {
	profile := &vkv1.VkProfile{
		VkUserId:             user.ID,
		FirstName:            user.FirstName,
		LastName:             user.LastName,
		ScreenName:           user.ScreenName,
		PhotoUrl:             user.PhotoURL,
		City:                 referenceFromVK(user.City),
		Country:              referenceFromVK(user.Country),
		HomeTown:             user.HomeTown,
		BdateRaw:             user.BDate,
		OnlineStatus:         onlineStatus(user.Online),
		Relation:             relationStatus(user.Relation),
		Visibility:           visibility(user.IsClosed),
		PrivateMessageStatus: privateMessageStatus(user.CanWritePrivateMessage),
	}
	if user.LastSeen != nil && user.LastSeen.Time > 0 {
		profile.LastSeenAt = timestamppb.New(time.Unix(user.LastSeen.Time, 0))
	}
	if user.University > 0 || user.UniversityName != "" {
		profile.University = &vkv1.VkReference{Id: user.University, Title: user.UniversityName}
	}
	if user.Faculty > 0 || user.FacultyName != "" {
		profile.Faculty = &vkv1.VkReference{Id: user.Faculty, Title: user.FacultyName}
	}
	if user.Graduation > 0 {
		profile.GraduationYear = &user.Graduation
	}

	return profile
}

func referenceFromVK(ref *vkReference) *vkv1.VkReference {
	if ref == nil {
		return nil
	}
	return &vkv1.VkReference{Id: ref.ID, Title: ref.Title}
}

func onlineStatus(online int) vkv1.VkOnlineStatus {
	if online == 1 {
		return vkv1.VkOnlineStatus_VK_ONLINE_STATUS_ONLINE
	}
	return vkv1.VkOnlineStatus_VK_ONLINE_STATUS_OFFLINE
}

func visibility(isClosed bool) vkv1.VkProfileVisibility {
	if isClosed {
		return vkv1.VkProfileVisibility_VK_PROFILE_VISIBILITY_CLOSED
	}
	return vkv1.VkProfileVisibility_VK_PROFILE_VISIBILITY_OPEN
}

func privateMessageStatus(value *int32) vkv1.VkPrivateMessageStatus {
	if value == nil {
		return vkv1.VkPrivateMessageStatus_VK_PRIVATE_MESSAGE_STATUS_UNKNOWN
	}
	if *value == 1 {
		return vkv1.VkPrivateMessageStatus_VK_PRIVATE_MESSAGE_STATUS_ALLOWED
	}
	return vkv1.VkPrivateMessageStatus_VK_PRIVATE_MESSAGE_STATUS_DENIED
}

func relationStatus(value int32) vkv1.VkRelationStatus {
	switch value {
	case 1:
		return vkv1.VkRelationStatus_VK_RELATION_STATUS_SINGLE
	case 2:
		return vkv1.VkRelationStatus_VK_RELATION_STATUS_RELATIONSHIP
	case 3:
		return vkv1.VkRelationStatus_VK_RELATION_STATUS_ENGAGED
	case 4:
		return vkv1.VkRelationStatus_VK_RELATION_STATUS_MARRIED
	case 5:
		return vkv1.VkRelationStatus_VK_RELATION_STATUS_COMPLICATED
	case 6:
		return vkv1.VkRelationStatus_VK_RELATION_STATUS_SEARCHING
	case 7:
		return vkv1.VkRelationStatus_VK_RELATION_STATUS_IN_LOVE
	case 8:
		return vkv1.VkRelationStatus_VK_RELATION_STATUS_CIVIL_UNION
	default:
		return vkv1.VkRelationStatus_VK_RELATION_STATUS_NOT_SPECIFIED
	}
}

func vkOAuthError(code string, description string) error {
	if code == "invalid_grant" || code == "invalid_client" {
		return fmt.Errorf("%w: %s", ErrUnauthorized, code)
	}
	if description != "" {
		return fmt.Errorf("vk oauth error: %s", description)
	}
	return fmt.Errorf("vk oauth error: %s", code)
}

func vkAPIError(err *vkError) error {
	switch err.Code {
	case 5:
		return fmt.Errorf("%w: vk api error %d", ErrUnauthorized, err.Code)
	case 113:
		return fmt.Errorf("%w: vk api error %d", ErrNotFound, err.Code)
	default:
		return fmt.Errorf("vk api error %d: %s", err.Code, err.Message)
	}
}

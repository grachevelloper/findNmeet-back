package vkmock

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	sharedv1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/shared/v1"
	vkv1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/vk/v1"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type Delegate interface {
	ExchangeOAuthCode(ctx context.Context, code string, redirectURI string, codeVerifier string, state string, deviceID string) (string, *vkv1.VkOAuthTokens, error)
	GetCurrentProfile(ctx context.Context, accessToken string) (*vkv1.VkProfile, error)
	GetProfile(ctx context.Context, lookup string, accessToken string) (*vkv1.VkProfile, error)
}

type Client struct {
	delegate Delegate
	profiles []*vkv1.VkProfile
}

func NewClient() *Client {
	return &Client{profiles: buildProfiles()}
}

func NewDelegatingClient(delegate Delegate) *Client {
	return &Client{
		delegate: delegate,
		profiles: buildProfiles(),
	}
}

func (c *Client) ExchangeOAuthCode(ctx context.Context, code string, redirectURI string, codeVerifier string, state string, deviceID string) (string, *vkv1.VkOAuthTokens, error) {
	if c.delegate == nil {
		return "", nil, fmt.Errorf("mock delegate is not configured")
	}
	return c.delegate.ExchangeOAuthCode(ctx, code, redirectURI, codeVerifier, state, deviceID)
}

func (c *Client) GetCurrentProfile(ctx context.Context, accessToken string) (*vkv1.VkProfile, error) {
	if c.delegate == nil {
		return nil, fmt.Errorf("mock delegate is not configured")
	}
	return c.delegate.GetCurrentProfile(ctx, accessToken)
}

func (c *Client) GetProfile(ctx context.Context, lookup string, accessToken string) (*vkv1.VkProfile, error) {
	if c.delegate == nil {
		return nil, fmt.Errorf("mock delegate is not configured")
	}
	return c.delegate.GetProfile(ctx, lookup, accessToken)
}

func (c *Client) SearchProfiles(_ context.Context, filters *vkv1.VkSearchFilters, page *sharedv1.PageRequest, _ string) (*vkv1.VkSearchResult, *sharedv1.PageResponse, error) {
	offset, err := searchOffset(page)
	if err != nil {
		return nil, nil, err
	}
	count := searchCount(page)

	filtered := make([]*vkv1.VkProfile, 0, len(c.profiles))
	for _, profile := range c.profiles {
		if matchesFilters(profile, filters) {
			filtered = append(filtered, profile)
		}
	}

	if offset > len(filtered) {
		offset = len(filtered)
	}
	end := offset + count
	if end > len(filtered) {
		end = len(filtered)
	}

	nextPageToken := ""
	if end < len(filtered) {
		nextPageToken = strconv.Itoa(end)
	}

	total := int64(len(filtered))
	return &vkv1.VkSearchResult{
			TotalCount: &total,
			Profiles:   filtered[offset:end],
		},
		&sharedv1.PageResponse{NextPageToken: nextPageToken},
		nil
}

func buildProfiles() []*vkv1.VkProfile {
	profiles := buildMoscowAnnaProfiles()
	return append(profiles, buildGeneratedProfiles(int64(len(profiles)+1))...)
}

func buildMoscowAnnaProfiles() []*vkv1.VkProfile {
	moscow := &vkv1.VkReference{Id: 1, Title: "Москва"}
	country := &vkv1.VkReference{Id: 1, Title: "Россия"}
	universities := []*vkv1.VkReference{
		{Id: 101, Title: "МГУ"},
		{Id: 103, Title: "ВШЭ"},
		{Id: 107, Title: "РАНХиГС"},
		{Id: 108, Title: "Финансовый университет"},
		{Id: 109, Title: "РЭУ им. Г. В. Плеханова"},
		{Id: 110, Title: "МГИМО"},
		{Id: 111, Title: "МГТУ им. Н. Э. Баумана"},
		{Id: 112, Title: "РГУ им. А. Н. Косыгина"},
	}
	faculties := []*vkv1.VkReference{
		{Id: 1001, Title: "Факультет журналистики"},
		{Id: 1002, Title: "Экономический факультет"},
		{Id: 1004, Title: "Факультет информатики"},
		{Id: 1005, Title: "Юридический факультет"},
		{Id: 1007, Title: "Факультет коммуникаций"},
		{Id: 1008, Title: "Факультет дизайна"},
		{Id: 1009, Title: "Факультет психологии"},
		{Id: 1010, Title: "Факультет менеджмента"},
	}
	photoURLs := []string{
		"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1491349174775-aaafddd81942?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1517365830460-955ce3ccd263?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1514315384763-ba401779410f?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=400&h=400&q=80",
		"https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=400&h=400&q=80",
	}
	lastNames := []string{
		"Васильева", "Морозова", "Новикова", "Фёдорова", "Михайлова", "Орлова", "Андреева",
		"Макарова", "Николаева", "Захарова", "Зайцева", "Павлова", "Соловьёва", "Борисова",
		"Яковлева", "Григорьева", "Романова", "Воробьёва", "Сергеева", "Киселёва", "Беляева",
		"Комарова", "Полякова", "Виноградова", "Богданова", "Титова", "Крылова", "Кузьмина",
		"Семёнова", "Голубева", "Медведева", "Антонова", "Тарасова", "Жукова", "Баранова",
		"Фролова", "Козлова", "Егорова", "Сидорова", "Калинина", "Чернова",
	}
	relations := []vkv1.VkRelationStatus{
		vkv1.VkRelationStatus_VK_RELATION_STATUS_SINGLE,
		vkv1.VkRelationStatus_VK_RELATION_STATUS_NOT_SPECIFIED,
		vkv1.VkRelationStatus_VK_RELATION_STATUS_SEARCHING,
		vkv1.VkRelationStatus_VK_RELATION_STATUS_RELATIONSHIP,
	}

	profiles := make([]*vkv1.VkProfile, 0, len(lastNames))
	baseLastSeen := time.Date(2026, time.May, 31, 12, 0, 0, 0, time.UTC)
	for i, lastName := range lastNames {
		age := int32(21 + (i % 13))
		graduationYear := int32(2021 + (i % 7))
		onlineStatus := vkv1.VkOnlineStatus_VK_ONLINE_STATUS_OFFLINE
		lastSeenAt := timestamppb.New(baseLastSeen.Add(-time.Duration(20+i*17) * time.Minute))
		if i%3 == 0 {
			onlineStatus = vkv1.VkOnlineStatus_VK_ONLINE_STATUS_ONLINE
			lastSeenAt = timestamppb.New(baseLastSeen.Add(-time.Duration(i%8) * time.Minute))
		}

		profiles = append(profiles, &vkv1.VkProfile{
			VkUserId:             int64(10_000 + i + 1),
			FirstName:            "Анна",
			LastName:             lastName,
			ScreenName:           fmt.Sprintf("anna_msk_demo_%02d", i+1),
			PhotoUrl:             photoURLs[i%len(photoURLs)],
			City:                 moscow,
			Country:              country,
			HomeTown:             "Москва",
			University:           universities[i%len(universities)],
			Faculty:              faculties[(i+i/3)%len(faculties)],
			GraduationYear:       &graduationYear,
			BdateRaw:             fmt.Sprintf("%02d.%02d.%d", 2+(i%26), 1+(i%12), 2005-int(age)),
			Age:                  &age,
			OnlineStatus:         onlineStatus,
			LastSeenAt:           lastSeenAt,
			Relation:             relations[i%len(relations)],
			Visibility:           vkv1.VkProfileVisibility_VK_PROFILE_VISIBILITY_OPEN,
			PrivateMessageStatus: vkv1.VkPrivateMessageStatus_VK_PRIVATE_MESSAGE_STATUS_ALLOWED,
		})
	}

	return profiles
}

func buildGeneratedProfiles(startID int64) []*vkv1.VkProfile {
	firstNames := []string{"Анна", "Мария", "Елена", "Дарья", "Ирина", "София", "Иван", "Алексей", "Дмитрий", "Максим", "Никита", "Павел"}
	lastNames := []string{"Иванова", "Петрова", "Смирнова", "Кузнецова", "Волкова", "Соколова", "Иванов", "Петров", "Смирнов", "Кузнецов", "Волков", "Соколов"}
	cities := []*vkv1.VkReference{
		{Id: 1, Title: "Москва"},
		{Id: 2, Title: "Санкт-Петербург"},
		{Id: 49, Title: "Казань"},
		{Id: 99, Title: "Новосибирск"},
		{Id: 54, Title: "Екатеринбург"},
		{Id: 72, Title: "Нижний Новгород"},
	}
	universities := []*vkv1.VkReference{
		{Id: 101, Title: "МГУ"},
		{Id: 102, Title: "СПбГУ"},
		{Id: 103, Title: "ВШЭ"},
		{Id: 104, Title: "ИТМО"},
		{Id: 105, Title: "МФТИ"},
		{Id: 106, Title: "КФУ"},
	}
	faculties := []*vkv1.VkReference{
		{Id: 1001, Title: "Факультет журналистики"},
		{Id: 1002, Title: "Экономический факультет"},
		{Id: 1003, Title: "Факультет ВМК"},
		{Id: 1004, Title: "Факультет информатики"},
		{Id: 1005, Title: "Юридический факультет"},
		{Id: 1006, Title: "Филологический факультет"},
	}
	relations := []vkv1.VkRelationStatus{
		vkv1.VkRelationStatus_VK_RELATION_STATUS_SINGLE,
		vkv1.VkRelationStatus_VK_RELATION_STATUS_RELATIONSHIP,
		vkv1.VkRelationStatus_VK_RELATION_STATUS_ENGAGED,
		vkv1.VkRelationStatus_VK_RELATION_STATUS_MARRIED,
		vkv1.VkRelationStatus_VK_RELATION_STATUS_SEARCHING,
		vkv1.VkRelationStatus_VK_RELATION_STATUS_NOT_SPECIFIED,
	}

	profiles := make([]*vkv1.VkProfile, 0, len(firstNames)*len(lastNames))
	baseLastSeen := time.Date(2026, time.May, 31, 9, 0, 0, 0, time.UTC)

	for i := 0; i < len(firstNames)*len(lastNames); i++ {
		vkUserID := startID + int64(i)
		city := cities[i%len(cities)]
		university := universities[i%len(universities)]
		faculty := faculties[i%len(faculties)]
		age := int32(19 + (i % 15))
		graduationYear := int32(2024 + (i % 5))
		onlineStatus := vkv1.VkOnlineStatus_VK_ONLINE_STATUS_OFFLINE
		lastSeenAt := timestamppb.New(baseLastSeen.Add(-time.Duration(i) * time.Hour))
		if i%2 == 0 {
			onlineStatus = vkv1.VkOnlineStatus_VK_ONLINE_STATUS_ONLINE
			lastSeenAt = timestamppb.New(baseLastSeen.Add(-time.Duration(i%6) * time.Minute))
		}

		profiles = append(profiles, &vkv1.VkProfile{
			VkUserId:             vkUserID,
			FirstName:            firstNames[i%len(firstNames)],
			LastName:             lastNames[(i/len(firstNames))%len(lastNames)],
			ScreenName:           fmt.Sprintf("id%d", vkUserID),
			PhotoUrl:             "https://vk.com/images/camera_200.png",
			City:                 city,
			Country:              &vkv1.VkReference{Id: 1, Title: "Россия"},
			HomeTown:             city.GetTitle(),
			University:           university,
			Faculty:              faculty,
			GraduationYear:       &graduationYear,
			BdateRaw:             fmt.Sprintf("%02d.%02d.199%d", 1+(i%27), 1+(i%12), i%10),
			Age:                  &age,
			OnlineStatus:         onlineStatus,
			LastSeenAt:           lastSeenAt,
			Relation:             relations[i%len(relations)],
			Visibility:           vkv1.VkProfileVisibility_VK_PROFILE_VISIBILITY_OPEN,
			PrivateMessageStatus: vkv1.VkPrivateMessageStatus_VK_PRIVATE_MESSAGE_STATUS_ALLOWED,
		})
	}

	return profiles
}

func matchesFilters(profile *vkv1.VkProfile, filters *vkv1.VkSearchFilters) bool {
	if filters == nil {
		return true
	}
	if filters.GetQuery() != "" && !matchesQuery(profile, filters.GetQuery()) && !matchesMoscowAnnaProfile(profile, filters) {
		return false
	}
	if ref := filters.GetCity(); ref != nil && ref.GetId() > 0 && profile.GetCity().GetId() != ref.GetId() {
		return false
	}
	if ref := filters.GetCountry(); ref != nil && ref.GetId() > 0 && profile.GetCountry().GetId() != ref.GetId() {
		return false
	}
	if ref := filters.GetUniversity(); ref != nil && ref.GetId() > 0 && profile.GetUniversity().GetId() != ref.GetId() {
		return false
	}
	if ref := filters.GetFaculty(); ref != nil && ref.GetId() > 0 && profile.GetFaculty().GetId() != ref.GetId() {
		return false
	}
	if ageFrom := filters.GetAgeFrom(); ageFrom > 0 && profile.GetAge() < ageFrom {
		return false
	}
	if ageTo := filters.GetAgeTo(); ageTo > 0 && profile.GetAge() > ageTo {
		return false
	}
	if graduationYear := filters.GetGraduationYear(); graduationYear > 0 && profile.GetGraduationYear() != graduationYear {
		return false
	}
	if relation := filters.GetRelation(); relation != vkv1.VkRelationStatus_VK_RELATION_STATUS_UNSPECIFIED && profile.GetRelation() != relation {
		return false
	}
	if filters.GetOnlineOnly() && profile.GetOnlineStatus() != vkv1.VkOnlineStatus_VK_ONLINE_STATUS_ONLINE {
		return false
	}
	return true
}

func matchesQuery(profile *vkv1.VkProfile, query string) bool {
	query = normalize(query)
	if query == "" {
		return true
	}

	if isMoscowAnnaQuery(query) {
		return strings.HasPrefix(profile.GetScreenName(), "anna_msk_demo_")
	}

	candidates := []string{
		profile.GetFirstName(),
		profile.GetLastName(),
		profile.GetFirstName() + " " + profile.GetLastName(),
		profile.GetScreenName(),
		profile.GetHomeTown(),
		profile.GetCity().GetTitle(),
		profile.GetUniversity().GetTitle(),
		profile.GetFaculty().GetTitle(),
	}
	for _, candidate := range candidates {
		if strings.Contains(normalize(candidate), query) {
			return true
		}
	}
	return false
}

func normalize(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func isMoscowAnnaQuery(query string) bool {
	return strings.Contains(query, "анн") && strings.Contains(query, "моск")
}

func isMoscowAnnaFilters(filters *vkv1.VkSearchFilters) bool {
	query := normalize(filters.GetQuery())
	if !strings.Contains(query, "анн") {
		return false
	}
	if strings.Contains(query, "моск") {
		return true
	}

	city := filters.GetCity()
	return city != nil && (city.GetId() == 1 || strings.Contains(normalize(city.GetTitle()), "моск"))
}

func matchesMoscowAnnaProfile(profile *vkv1.VkProfile, filters *vkv1.VkSearchFilters) bool {
	return isMoscowAnnaFilters(filters) && strings.HasPrefix(profile.GetScreenName(), "anna_msk_demo_")
}

func searchOffset(page *sharedv1.PageRequest) (int, error) {
	if page == nil || page.GetPageToken() == "" {
		return 0, nil
	}

	offset, err := strconv.Atoi(page.GetPageToken())
	if err != nil || offset < 0 {
		return 0, fmt.Errorf("invalid page token")
	}

	return offset, nil
}

func searchCount(page *sharedv1.PageRequest) int {
	if page == nil || page.GetPageSize() <= 0 {
		return 20
	}
	if page.GetPageSize() > 1000 {
		return 1000
	}

	return int(page.GetPageSize())
}

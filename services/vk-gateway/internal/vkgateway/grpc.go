package vkgateway

import (
	"context"

	vkv1 "github.com/findnmeet/vk-gateway/internal/gen/findnmeet/vk/v1"
	"google.golang.org/grpc"
)

type Server interface {
	ExchangeOAuthCode(context.Context, *vkv1.ExchangeOAuthCodeRequest) (*vkv1.ExchangeOAuthCodeResponse, error)
	GetProfile(context.Context, *vkv1.GetProfileRequest) (*vkv1.GetProfileResponse, error)
	SearchProfiles(context.Context, *vkv1.SearchProfilesRequest) (*vkv1.SearchProfilesResponse, error)
}

func RegisterVkGatewayServiceServer(registrar grpc.ServiceRegistrar, server Server) {
	registrar.RegisterService(&grpc.ServiceDesc{
		ServiceName: "findnmeet.vk.v1.VkGatewayService",
		HandlerType: (*Server)(nil),
		Methods: []grpc.MethodDesc{
			{MethodName: "ExchangeOAuthCode", Handler: exchangeOAuthCodeHandler},
			{MethodName: "GetProfile", Handler: getProfileHandler},
			{MethodName: "SearchProfiles", Handler: searchProfilesHandler},
		},
		Streams:  []grpc.StreamDesc{},
		Metadata: "findnmeet/vk/v1/service.proto",
	}, server)
}

func exchangeOAuthCodeHandler(server any, ctx context.Context, decode func(any) error, interceptor grpc.UnaryServerInterceptor) (any, error) {
	request := new(vkv1.ExchangeOAuthCodeRequest)
	if err := decode(request); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return server.(Server).ExchangeOAuthCode(ctx, request)
	}

	info := &grpc.UnaryServerInfo{Server: server, FullMethod: "/findnmeet.vk.v1.VkGatewayService/ExchangeOAuthCode"}
	handler := func(ctx context.Context, req any) (any, error) {
		return server.(Server).ExchangeOAuthCode(ctx, req.(*vkv1.ExchangeOAuthCodeRequest))
	}

	return interceptor(ctx, request, info, handler)
}

func getProfileHandler(server any, ctx context.Context, decode func(any) error, interceptor grpc.UnaryServerInterceptor) (any, error) {
	request := new(vkv1.GetProfileRequest)
	if err := decode(request); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return server.(Server).GetProfile(ctx, request)
	}

	info := &grpc.UnaryServerInfo{Server: server, FullMethod: "/findnmeet.vk.v1.VkGatewayService/GetProfile"}
	handler := func(ctx context.Context, req any) (any, error) {
		return server.(Server).GetProfile(ctx, req.(*vkv1.GetProfileRequest))
	}

	return interceptor(ctx, request, info, handler)
}

func searchProfilesHandler(server any, ctx context.Context, decode func(any) error, interceptor grpc.UnaryServerInterceptor) (any, error) {
	request := new(vkv1.SearchProfilesRequest)
	if err := decode(request); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return server.(Server).SearchProfiles(ctx, request)
	}

	info := &grpc.UnaryServerInfo{Server: server, FullMethod: "/findnmeet.vk.v1.VkGatewayService/SearchProfiles"}
	handler := func(ctx context.Context, req any) (any, error) {
		return server.(Server).SearchProfiles(ctx, req.(*vkv1.SearchProfilesRequest))
	}

	return interceptor(ctx, request, info, handler)
}

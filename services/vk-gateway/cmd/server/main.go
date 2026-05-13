package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"

	"github.com/findnmeet/vk-gateway/internal/config"
	"github.com/findnmeet/vk-gateway/internal/vkapi"
	"github.com/findnmeet/vk-gateway/internal/vkgateway"
	"google.golang.org/grpc"
)

type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
}

func healthHandler(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(HealthResponse{Status: "ok", Service: "vk-gateway"})
}

func main() {
	cfg := config.FromEnv()
	client := vkapi.NewClient(vkapi.Config{
		AppID:      cfg.VKAppID,
		AppSecret:  cfg.VKAppSecret,
		APIVersion: cfg.VKAPIVersion,
		OAuthURL:   cfg.VKOAuthURL,
		APIURL:     cfg.VKAPIURL,
		Timeout:    cfg.HTTPTimeout,
	})

	grpcListener, err := net.Listen("tcp", cfg.GRPCAddress)
	if err != nil {
		log.Fatalf("failed to listen on %s: %v", cfg.GRPCAddress, err)
	}

	grpcServer := grpc.NewServer()
	vkgateway.RegisterVkGatewayServiceServer(grpcServer, vkgateway.NewService(client))

	go func() {
		mux := http.NewServeMux()
		mux.HandleFunc("/health", healthHandler)
		fmt.Printf("vk-gateway health server running on %s\n", cfg.HTTPAddress)
		if err := http.ListenAndServe(cfg.HTTPAddress, mux); err != nil {
			log.Fatalf("health server failed: %v", err)
		}
	}()

	fmt.Printf("vk-gateway gRPC server running on %s\n", cfg.GRPCAddress)
	log.Fatal(grpcServer.Serve(grpcListener))
}

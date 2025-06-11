package controller

import (
	"github.com/Ayush-Vish/shellsync/api/proto"
	"testing"
)

func TestCreateSession(t *testing.T) {
	type args struct {
		client proto.ShellSyncClient
	}
	tests := []struct {
		name    string
		args    args
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := CreateSession(tt.args.client); (err != nil) != tt.wantErr {
				t.Errorf("CreateSession() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestStart(t *testing.T) {
	type args struct {
		host string
		port int
	}
	tests := []struct {
		name string
		args args
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			Start(tt.args.host, tt.args.port)
		})
	}
}

func Test_startStream(t *testing.T) {
	type args struct {
		client proto.ShellSyncClient
	}
	tests := []struct {
		name    string
		args    args
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := startStream(tt.args.client); (err != nil) != tt.wantErr {
				t.Errorf("startStream() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

package utils

import (
	"github.com/go-redis/redis/v8"
)

func ConnectRedis(redisUrl string) (client *redis.Client, err error) {
	opt, err := redis.ParseURL(redisUrl)
	if err != nil {
		return nil, err
	}
	client = redis.NewClient(opt)
	return client, nil
}

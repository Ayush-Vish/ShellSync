	package main

	import (
		"fmt"
		"sync"
		"time"
	)

	func task(id int, wg *sync.WaitGroup) {
		defer wg.Done()
		fmt.Println("task", id)

	}

	func emailSender(emailChan chan string, done chan bool) {
		defer func() {done <- true}()
		for email := range emailChan {
			fmt.Println("sending email", email)
			time.Sleep(time.Second)
		}
	}

	func main() {
		// var wg sync.WaitGroup

		// for i := 0; i <= 10; i++ {
		// 	wg.Add(1)
		// 	go task(i, &wg)
		// }
		// wg.Wait()

		// messagechan := make(chan string)
		// messagechan <- "hello"

		// msg := <- messagechan
		// fmt.Println(msg)

		emailchan := make(chan string, 100)
		done := make(chan bool)
		go emailSender(emailchan, done)
		for i := 0; i < 100; i++ {
			emailchan <- fmt.Sprintf("email %d", i)
		}
		for i := 0; i < 100; i++ {
			fmt.Println(<-emailchan)
		}
		<- done

	}

package controller

import (
	"io"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/aymanbagabas/go-pty"
	"golang.org/x/term"
)

type PTY interface {
	Resize(w, h int) error
}

func notifySizeChanges(ch chan os.Signal) {
	signal.Notify(ch, syscall.SIGWINCH)
}

func handlePtySize(p pty.Pty, ch chan os.Signal) {
	for range ch {
		w, h, err := term.GetSize(int(os.Stdin.Fd()))
		if err != nil {
			log.Printf("error resizing pty: %s", err)
			continue
		}
		if err := p.Resize(w, h); err != nil {
			log.Printf("error resizing pty: %s", err)
		}
	}
}

func initSizeChange(ch chan os.Signal) {
	ch <- syscall.SIGWINCH
}
func Terminal(commands []string) error {
	ptmx, err := pty.New()
	if err != nil {
		log.Fatal(err)
	}

	defer ptmx.Close()

	c := ptmx.Command(`bash`)
	if err := c.Start(); err != nil {
		return err
	}

	// Handle pty size.
	ch := make(chan os.Signal, 1)
	notifySizeChanges(ch)
	go handlePtySize(ptmx, ch)
	initSizeChange(ch)
	defer func() { signal.Stop(ch); close(ch) }() // Cleanup signals when done.

	// Set stdin in raw mode.
	oldState, err := term.MakeRaw(int(os.Stdin.Fd()))
	if err != nil {
		panic(err)
	}
	defer func() { _ = term.Restore(int(os.Stdin.Fd()), oldState) }() // Best effort.

	// Copy stdin to the pty and the pty to stdout.
	// NOTE: The goroutine will keep reading until the next keystroke before returning.L

	// log File
	logFile, err := os.Create("shell_output.log")
	if err != nil {
		log.Fatalf("Failed to create output log: %v", err)
	}
	defer logFile.Close()

	go io.Copy(ptmx, os.Stdin)
	multiWriter := io.MultiWriter(os.Stdout, logFile)
	go io.Copy(multiWriter, ptmx)
	go io.Copy(os.Stdout, ptmx)

	return c.Wait()
}

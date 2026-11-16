// The small server behind Lately, the notes app on latesailor.dev. Anyone can read published posts; signing in
// with the one admin password allows writing, editing and deleting them. Posts live in a single SQLite file.
//
// It listens on this machine only (127.0.0.1) and expects nginx in front of it, passing /api/ through.
//
//	portfolio-api            run the server
//	portfolio-api -dev       run it for local work: plain-http cookie, a throwaway password, a sample post
//	portfolio-api -hash      turn a password into the hash to put in API_ADMIN_HASH
//	portfolio-api -backup F  write a copy of the database to the file F
//
// Settings come from the environment: API_ADDR (127.0.0.1:8787), API_DB (lately.db) and API_ADMIN_HASH.
package main

import (
	"bufio"
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	"golang.org/x/crypto/bcrypt"
	"golang.org/x/term"
)

type app struct {
	store    *store
	hash     []byte // bcrypt hash of the admin password; nil means nobody can sign in
	secure   bool   // send the session cookie over https only
	failures failures
	checking sync.Mutex
	now      func() time.Time
	log      *slog.Logger
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	dev := flag.Bool("dev", false, "run for local work: plain-http cookie, a throwaway password, a sample post")
	hash := flag.Bool("hash", false, "ask for a password and print its hash for API_ADMIN_HASH")
	backup := flag.String("backup", "", "write a copy of the database to this file, then exit")
	flag.Parse()
	log := slog.New(slog.NewTextHandler(os.Stderr, nil))

	if *hash {
		if err := printHash(); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		return
	}

	store, err := openStore(env("API_DB", "lately.db"))
	if err != nil {
		log.Error("can't open the database", "err", err)
		os.Exit(1)
	}
	defer store.close()

	if *backup != "" {
		if err := store.backup(context.Background(), *backup); err != nil {
			log.Error("backup failed", "err", err)
			os.Exit(1)
		}
		return
	}

	a := &app{store: store, secure: !*dev, now: time.Now, log: log}
	if h := env("API_ADMIN_HASH", ""); h != "" {
		if _, err := bcrypt.Cost([]byte(h)); err != nil {
			log.Error("API_ADMIN_HASH isn't a bcrypt hash; make one with -hash")
			os.Exit(1)
		}
		a.hash = []byte(h)
	}
	if *dev {
		if err := a.setUpDev(); err != nil {
			log.Error("can't set up dev mode", "err", err)
			os.Exit(1)
		}
	}
	if a.hash == nil {
		log.Warn("API_ADMIN_HASH is not set: posts can be read, but nobody can sign in")
	}

	srv := &http.Server{
		Addr:              env("API_ADDR", "127.0.0.1:8787"),
		Handler:           a.routes(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    16 << 10,
	}
	stop, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	go func() {
		<-stop.Done()
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		srv.Shutdown(ctx)
	}()
	log.Info("listening", "addr", srv.Addr, "dev", *dev)
	if err := srv.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		log.Error("server stopped", "err", err)
		os.Exit(1)
	}
}

// setUpDev makes local work possible without any setup. With no hash given, it makes up a password for this
// run and prints it; an empty database gets one post, so there is something to look at.
func (a *app) setUpDev() error {
	if a.hash == nil {
		raw := make([]byte, 9)
		if _, err := rand.Read(raw); err != nil {
			return err
		}
		password := base64.RawURLEncoding.EncodeToString(raw)
		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.MinCost)
		if err != nil {
			return err
		}
		a.hash = hash
		fmt.Fprintf(os.Stderr, "\n  dev password for this run: %s\n\n", password)
	}
	n, err := a.store.countPosts(context.Background())
	if err != nil || n > 0 {
		return err
	}
	_, err = a.store.createPost(context.Background(), "hello", "Hello from the dev server",
		"This post was made by the server's dev mode, so there is something to read.\n\n## Try it\n\n- Sign in with the password the server printed when it started\n- Write a post, save it as a draft, then publish it\n- **Delete** this one\n", true, a.now())
	return err
}

// printHash asks for a password and prints the line for the server's env file. At a keyboard the password is
// asked for twice and isn't shown; piped in, one line is read.
func printHash() error {
	var password string
	if fd := int(os.Stdin.Fd()); term.IsTerminal(fd) {
		fmt.Fprint(os.Stderr, "Password: ")
		first, err := term.ReadPassword(fd)
		fmt.Fprint(os.Stderr, "\nAgain: ")
		second, err2 := term.ReadPassword(fd)
		fmt.Fprintln(os.Stderr)
		if err != nil || err2 != nil {
			return errors.New("couldn't read the password")
		}
		if string(first) != string(second) {
			return errors.New("the two didn't match")
		}
		password = string(first)
	} else {
		line, _ := bufio.NewReader(os.Stdin).ReadString('\n')
		password = strings.TrimRight(line, "\r\n")
	}
	if len(password) < 12 {
		return errors.New("use at least 12 characters")
	}
	if len(password) > maxPassword {
		return fmt.Errorf("use at most %d characters", maxPassword)
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return err
	}
	// Single quotes, because the hash is full of dollar signs.
	fmt.Printf("API_ADMIN_HASH='%s'\n", hash)
	return nil
}

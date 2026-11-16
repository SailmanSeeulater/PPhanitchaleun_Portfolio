package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"
)

const testPassword = "correct horse battery"

// A server on a throwaway database, and a client that keeps cookies the way a browser does.
func start(t *testing.T) (*httptest.Server, *http.Client, *app) {
	t.Helper()
	store, err := openStore(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { store.close() })
	hash, _ := bcrypt.GenerateFromPassword([]byte(testPassword), bcrypt.MinCost)
	a := &app{store: store, hash: hash, now: time.Now, log: slog.New(slog.NewTextHandler(io.Discard, nil))}
	srv := httptest.NewServer(a.routes())
	t.Cleanup(srv.Close)
	jar, _ := cookiejar.New(nil)
	return srv, &http.Client{Jar: jar}, a
}

// call sends JSON and returns the status and the decoded answer.
func call(t *testing.T, c *http.Client, method, url string, body any, headers ...string) (int, map[string]any) {
	t.Helper()
	var payload io.Reader
	if body != nil {
		raw, _ := json.Marshal(body)
		payload = bytes.NewReader(raw)
	}
	req, _ := http.NewRequest(method, url, payload)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	for i := 0; i+1 < len(headers); i += 2 {
		req.Header.Set(headers[i], headers[i+1])
	}
	res, err := c.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	out := map[string]any{}
	json.NewDecoder(res.Body).Decode(&out)
	return res.StatusCode, out
}

func signIn(t *testing.T, c *http.Client, base string) {
	t.Helper()
	if status, _ := call(t, c, "POST", base+"/api/login", map[string]string{"password": testPassword}); status != http.StatusNoContent {
		t.Fatalf("sign in: got %d", status)
	}
}

func TestWritingNeedsSigningIn(t *testing.T) {
	srv, c, _ := start(t)
	post := map[string]any{"title": "Nope", "body": "x", "published": true}
	for _, try := range []struct{ method, path string }{{"POST", "/api/posts"}, {"PUT", "/api/posts/nope"}, {"DELETE", "/api/posts/nope"}} {
		if status, _ := call(t, c, try.method, srv.URL+try.path, post); status != http.StatusUnauthorized {
			t.Errorf("%s %s without signing in: got %d, want 401", try.method, try.path, status)
		}
	}
	if status, _ := call(t, c, "POST", srv.URL+"/api/login", map[string]string{"password": "wrong"}); status != http.StatusUnauthorized {
		t.Errorf("wrong password: got %d, want 401", status)
	}
	if _, me := call(t, c, "GET", srv.URL+"/api/me", nil); me["signedIn"] != false {
		t.Errorf("signedIn after a wrong password: %v", me["signedIn"])
	}
}

func TestPostLifecycle(t *testing.T) {
	srv, c, _ := start(t)
	visitor := &http.Client{}
	signIn(t, c, srv.URL)
	if _, me := call(t, c, "GET", srv.URL+"/api/me", nil); me["signedIn"] != true {
		t.Fatalf("signedIn after signing in: %v", me["signedIn"])
	}

	// A draft: there for me, missing for a visitor.
	status, made := call(t, c, "POST", srv.URL+"/api/posts", map[string]any{"title": "Hello, World!", "body": "# Hi\n\nFirst **post**."})
	if status != http.StatusCreated || made["slug"] != "hello-world" || made["published"] != false || made["publishedAt"] != nil {
		t.Fatalf("create: %d %v", status, made)
	}
	if made["excerpt"] != "First post." {
		t.Errorf("excerpt: %q", made["excerpt"])
	}
	if status, _ := call(t, visitor, "GET", srv.URL+"/api/posts/hello-world", nil); status != http.StatusNotFound {
		t.Errorf("visitor reading a draft: got %d, want 404", status)
	}
	if _, list := call(t, visitor, "GET", srv.URL+"/api/posts", nil); len(list["posts"].([]any)) != 0 {
		t.Errorf("visitor's list shows a draft: %v", list)
	}
	if _, list := call(t, c, "GET", srv.URL+"/api/posts", nil); len(list["posts"].([]any)) != 1 {
		t.Errorf("my list is missing the draft: %v", list)
	}

	// The same title again gets a numbered address; asking for a taken one by name is refused.
	if _, second := call(t, c, "POST", srv.URL+"/api/posts", map[string]any{"title": "Hello, World!"}); second["slug"] != "hello-world-2" {
		t.Errorf("second slug: %v", second["slug"])
	}
	if status, _ := call(t, c, "POST", srv.URL+"/api/posts", map[string]any{"title": "Other", "slug": "hello-world"}); status != http.StatusConflict {
		t.Errorf("taken slug: got %d, want 409", status)
	}
	if status, _ := call(t, c, "POST", srv.URL+"/api/posts", map[string]any{"title": "Other", "slug": "Not A Slug"}); status != http.StatusUnprocessableEntity {
		t.Errorf("bad slug: got %d, want 422", status)
	}
	if status, _ := call(t, c, "POST", srv.URL+"/api/posts", map[string]any{"title": "  "}); status != http.StatusUnprocessableEntity {
		t.Errorf("empty title: got %d, want 422", status)
	}

	// Published: a visitor can read it, and the publish date survives a later edit.
	status, live := call(t, c, "PUT", srv.URL+"/api/posts/hello-world", map[string]any{"title": "Hello", "body": "Now public.", "published": true})
	if status != http.StatusOK || live["published"] != true || live["publishedAt"] == nil {
		t.Fatalf("publish: %d %v", status, live)
	}
	status, read := call(t, visitor, "GET", srv.URL+"/api/posts/hello-world", nil)
	if status != http.StatusOK || read["title"] != "Hello" || read["body"] != "Now public." {
		t.Errorf("visitor reading a published post: %d %v", status, read)
	}
	_, list := call(t, visitor, "GET", srv.URL+"/api/posts", nil)
	if posts := list["posts"].([]any); len(posts) != 1 || posts[0].(map[string]any)["body"] != "" {
		t.Errorf("visitor's list: %v", list)
	}
	if _, again := call(t, c, "PUT", srv.URL+"/api/posts/hello-world", map[string]any{"title": "Hello", "body": "Edited.", "published": true}); again["publishedAt"] != live["publishedAt"] {
		t.Errorf("publish date moved: %v to %v", live["publishedAt"], again["publishedAt"])
	}

	if status, _ := call(t, c, "DELETE", srv.URL+"/api/posts/hello-world", nil); status != http.StatusNoContent {
		t.Errorf("delete: got %d, want 204", status)
	}
	if status, _ := call(t, c, "DELETE", srv.URL+"/api/posts/hello-world", nil); status != http.StatusNotFound {
		t.Errorf("delete again: got %d, want 404", status)
	}

	// Signed out: the cookie no longer opens anything.
	if status, _ := call(t, c, "POST", srv.URL+"/api/logout", map[string]any{}); status != http.StatusNoContent {
		t.Errorf("sign out: got %d", status)
	}
	if status, _ := call(t, c, "POST", srv.URL+"/api/posts", map[string]any{"title": "After"}); status != http.StatusUnauthorized {
		t.Errorf("writing after signing out: got %d, want 401", status)
	}
}

func TestSessionsExpire(t *testing.T) {
	srv, c, a := start(t)
	signIn(t, c, srv.URL)
	a.now = func() time.Time { return time.Now().Add(sessionLife + time.Hour) }
	if _, me := call(t, c, "GET", srv.URL+"/api/me", nil); me["signedIn"] != false {
		t.Errorf("still signed in after the session's life: %v", me["signedIn"])
	}
}

func TestRequestsFromOtherSitesAreRefused(t *testing.T) {
	srv, c, _ := start(t)
	signIn(t, c, srv.URL)
	post := map[string]any{"title": "Forged"}
	if status, _ := call(t, c, "POST", srv.URL+"/api/posts", post, "Sec-Fetch-Site", "cross-site"); status != http.StatusForbidden {
		t.Errorf("cross-site write: got %d, want 403", status)
	}
	if status, _ := call(t, c, "POST", srv.URL+"/api/posts", post, "Origin", "https://elsewhere.example"); status != http.StatusForbidden {
		t.Errorf("write from another origin: got %d, want 403", status)
	}
	// A form post can't forge one either: only JSON is read.
	req, _ := http.NewRequest("POST", srv.URL+"/api/posts", strings.NewReader("title=Forged"))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	res, err := c.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if res.StatusCode != http.StatusUnsupportedMediaType {
		t.Errorf("form post: got %d, want 415", res.StatusCode)
	}
	if status, _ := call(t, c, "POST", srv.URL+"/api/posts", post, "Sec-Fetch-Site", "same-origin"); status != http.StatusCreated {
		t.Errorf("same-origin write: got %d, want 201", status)
	}
}

func TestWrongPasswordsRunOut(t *testing.T) {
	srv, c, _ := start(t)
	for i := 0; i < maxFailures; i++ {
		if status, _ := call(t, c, "POST", srv.URL+"/api/login", map[string]string{"password": "wrong"}); status != http.StatusUnauthorized {
			t.Fatalf("try %d: got %d, want 401", i+1, status)
		}
	}
	// Even the right password has to wait now.
	if status, _ := call(t, c, "POST", srv.URL+"/api/login", map[string]string{"password": testPassword}); status != http.StatusTooManyRequests {
		t.Errorf("after %d wrong tries: got %d, want 429", maxFailures, status)
	}
}

func TestTooMuchIsRefused(t *testing.T) {
	srv, c, _ := start(t)
	signIn(t, c, srv.URL)
	if status, _ := call(t, c, "POST", srv.URL+"/api/posts", map[string]any{"title": "Big", "body": strings.Repeat("a", maxBody+1)}); status != http.StatusUnprocessableEntity {
		t.Errorf("body over the limit: got %d, want 422", status)
	}
	if status, _ := call(t, c, "POST", srv.URL+"/api/posts", map[string]any{"title": "Huge", "body": strings.Repeat("a", maxRequest)}); status != http.StatusRequestEntityTooLarge {
		t.Errorf("request over the limit: got %d, want 413", status)
	}
}

func TestBackupIsACompleteCopy(t *testing.T) {
	srv, c, a := start(t)
	signIn(t, c, srv.URL)
	call(t, c, "POST", srv.URL+"/api/posts", map[string]any{"title": "Kept", "published": true})
	path := filepath.Join(t.TempDir(), "copy.db")
	if err := a.store.backup(t.Context(), path); err != nil {
		t.Fatal(err)
	}
	copied, err := openStore(path)
	if err != nil {
		t.Fatal(err)
	}
	defer copied.close()
	if n, err := copied.countPosts(t.Context()); err != nil || n != 1 {
		t.Errorf("posts in the copy: %d, %v", n, err)
	}
}

func TestSlugify(t *testing.T) {
	for title, want := range map[string]string{"Hello, World!": "hello-world", "  Go 1.27 & SQLite  ": "go-1-27-sqlite", "日本語": "", "a--b": "a-b"} {
		if got := slugify(title); got != want {
			t.Errorf("slugify(%q) = %q, want %q", title, got, want)
		}
	}
}

func TestANewPasswordSignsEveryoneOut(t *testing.T) {
	srv, c, a := start(t)
	signIn(t, c, srv.URL)
	a.hash, _ = bcrypt.GenerateFromPassword([]byte("a different password"), bcrypt.MinCost)
	if _, me := call(t, c, "GET", srv.URL+"/api/me", nil); me["signedIn"] != false {
		t.Errorf("still signed in after the password changed: %v", me["signedIn"])
	}
}

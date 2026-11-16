package main

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"net"
	"net/http"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"
)

const (
	cookieName  = "lately_session"
	sessionLife = 30 * 24 * time.Hour
	// bcrypt reads no further than this many bytes of a password.
	maxPassword = 72
	// How many wrong passwords one address may send in a window before it has to wait.
	maxFailures   = 5
	failureWindow = 15 * time.Minute
)

// There is one writer: me. Signing in is one password, checked against a bcrypt hash that the server is handed
// when it starts. A correct one gets a random token in a cookie that page scripts can't read.

// tokenKey is what the database keeps for a session: a hash of its cookie together with the password's hash.
// Folding the password in means a new password signs every browser out, with nothing to clean up.
func (a *app) tokenKey(token string) string {
	h := sha256.New()
	h.Write(a.hash)
	h.Write([]byte{0})
	h.Write([]byte(token))
	return hex.EncodeToString(h.Sum(nil))
}

func (a *app) signedIn(r *http.Request) bool {
	c, err := r.Cookie(cookieName)
	if err != nil || c.Value == "" {
		return false
	}
	live, err := a.store.sessionLive(r.Context(), a.tokenKey(c.Value), a.now())
	return err == nil && live
}

// requireAuth guards everything that changes a post.
func (a *app) requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !a.signedIn(r) {
			writeError(w, http.StatusUnauthorized, "Sign in first.")
			return
		}
		next(w, r)
	}
}

func (a *app) sessionCookie(value string, maxAge int) *http.Cookie {
	return &http.Cookie{Name: cookieName, Value: value, Path: "/api", MaxAge: maxAge, HttpOnly: true, Secure: a.secure, SameSite: http.SameSiteStrictMode}
}

func (a *app) login(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Password string `json:"password"`
	}
	if !readJSON(w, r, &in) {
		return
	}
	if a.hash == nil {
		writeError(w, http.StatusServiceUnavailable, "Signing in isn't set up on this server.")
		return
	}
	ip := clientIP(r)
	if !a.failures.allowed(ip, a.now()) {
		writeError(w, http.StatusTooManyRequests, "Too many tries. Wait a few minutes.")
		return
	}
	// One check at a time: bcrypt is slow on purpose, and a burst of guesses shouldn't use the whole processor.
	a.checking.Lock()
	wrong := len(in.Password) == 0 || len(in.Password) > maxPassword || bcrypt.CompareHashAndPassword(a.hash, []byte(in.Password)) != nil
	a.checking.Unlock()
	if wrong {
		a.failures.add(ip, a.now())
		writeError(w, http.StatusUnauthorized, "Wrong password.")
		return
	}
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		a.fail(w, r, err)
		return
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	if err := a.store.createSession(r.Context(), a.tokenKey(token), a.now().Add(sessionLife), a.now()); err != nil {
		a.fail(w, r, err)
		return
	}
	http.SetCookie(w, a.sessionCookie(token, int(sessionLife.Seconds())))
	w.WriteHeader(http.StatusNoContent)
}

func (a *app) logout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(cookieName); err == nil {
		if err := a.store.deleteSession(r.Context(), a.tokenKey(c.Value)); err != nil {
			a.fail(w, r, err)
			return
		}
	}
	http.SetCookie(w, a.sessionCookie("", -1))
	w.WriteHeader(http.StatusNoContent)
}

func (a *app) me(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]bool{"signedIn": a.signedIn(r)})
}

// clientIP is the visitor's address. nginx on the same machine passes it along in X-Real-IP; that header is
// believed only when the connection itself comes from this machine.
func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}
	if ip := net.ParseIP(host); ip != nil && ip.IsLoopback() {
		if real := net.ParseIP(r.Header.Get("X-Real-IP")); real != nil {
			return real.String()
		}
	}
	return host
}

// failures counts recent wrong passwords per address, in memory. Restarting the server clears it.
type failures struct {
	mu   sync.Mutex
	seen map[string][]time.Time
}

func (f *failures) recent(ip string, now time.Time) []time.Time {
	var kept []time.Time
	for _, t := range f.seen[ip] {
		if now.Sub(t) < failureWindow {
			kept = append(kept, t)
		}
	}
	return kept
}

func (f *failures) allowed(ip string, now time.Time) bool {
	f.mu.Lock()
	defer f.mu.Unlock()
	return len(f.recent(ip, now)) < maxFailures
}

func (f *failures) add(ip string, now time.Time) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.seen == nil {
		f.seen = map[string][]time.Time{}
	}
	// A flood of made-up addresses mustn't grow this without end. Forgetting everything now and then is fine.
	if len(f.seen) > 2000 {
		clear(f.seen)
	}
	f.seen[ip] = append(f.recent(ip, now), now)
}

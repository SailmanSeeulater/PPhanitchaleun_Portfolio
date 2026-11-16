package main

import (
	"encoding/json"
	"errors"
	"mime"
	"net/http"
	"time"
)

// The most a request may carry: a post's limit, with room for JSON's own escaping.
const maxRequest = 256 << 10

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// fail is for the unexpected: the reason goes to the log, not to the visitor.
func (a *app) fail(w http.ResponseWriter, r *http.Request, err error) {
	a.log.Error("request failed", "method", r.Method, "path", r.URL.Path, "err", err)
	writeError(w, http.StatusInternalServerError, "Something went wrong.")
}

// readJSON reads a request's JSON into v. It answers the request itself, and returns false, when it can't.
func readJSON(w http.ResponseWriter, r *http.Request, v any) bool {
	// Only JSON is taken. A plain web form on another site can't send that, which closes one way of forging a request.
	if kind, _, _ := mime.ParseMediaType(r.Header.Get("Content-Type")); kind != "application/json" {
		writeError(w, http.StatusUnsupportedMediaType, "Send JSON.")
		return false
	}
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxRequest))
	dec.DisallowUnknownFields()
	if err := dec.Decode(v); err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			writeError(w, http.StatusRequestEntityTooLarge, "That's too much to send at once.")
		} else {
			writeError(w, http.StatusBadRequest, "That isn't valid JSON for this request.")
		}
		return false
	}
	return true
}

// statusWriter remembers the status a handler sent, for the log.
type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

// routes wires every address to its handler, then wraps them all.
func (a *app) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/posts", a.listPosts)
	mux.HandleFunc("GET /api/posts/{slug}", a.getPost)
	mux.HandleFunc("POST /api/posts", a.requireAuth(a.createPost))
	mux.HandleFunc("PUT /api/posts/{slug}", a.requireAuth(a.updatePost))
	mux.HandleFunc("DELETE /api/posts/{slug}", a.requireAuth(a.deletePost))
	mux.HandleFunc("GET /api/me", a.me)
	mux.HandleFunc("POST /api/login", a.login)
	mux.HandleFunc("POST /api/logout", a.logout)
	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusNotFound, "Nothing at this address.")
	})

	// Refuses a request that changes something when a browser says another site sent it.
	guarded := http.NewCrossOriginProtection().Handler(mux)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		// What a visitor sees depends on whether they're signed in, so nothing in between may keep a copy.
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		guarded.ServeHTTP(sw, r)
		a.log.Info("request", "method", r.Method, "path", r.URL.Path, "status", sw.status, "ms", time.Since(start).Milliseconds())
	})
}

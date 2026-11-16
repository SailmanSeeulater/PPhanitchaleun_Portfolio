package main

import (
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"unicode/utf8"
)

const (
	maxTitle = 140     // characters
	maxBody  = 100_000 // bytes of Markdown
	maxSlug  = 80
)

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)

// slugify turns a title into the last part of a post's address: "Hello, World!" becomes "hello-world".
func slugify(title string) string {
	var b strings.Builder
	dash := false
	for _, r := range strings.ToLower(title) {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			if dash && b.Len() > 0 {
				b.WriteByte('-')
			}
			b.WriteRune(r)
			dash = false
		default:
			dash = true
		}
		if b.Len() >= maxSlug {
			break
		}
	}
	return strings.Trim(b.String(), "-")
}

// postInput is what the editor sends. Slug is read only when a post is made; after that its address stays put.
type postInput struct {
	Slug      string `json:"slug"`
	Title     string `json:"title"`
	Body      string `json:"body"`
	Published bool   `json:"published"`
}

func (in *postInput) check() string {
	in.Title = strings.TrimSpace(in.Title)
	switch {
	case in.Title == "":
		return "A post needs a title."
	case utf8.RuneCountInString(in.Title) > maxTitle:
		return fmt.Sprintf("The title is over %d characters.", maxTitle)
	case len(in.Body) > maxBody:
		return "The post is too long."
	}
	return ""
}

func (a *app) listPosts(w http.ResponseWriter, r *http.Request) {
	posts, err := a.store.listPosts(r.Context(), a.signedIn(r))
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"posts": posts})
}

func (a *app) getPost(w http.ResponseWriter, r *http.Request) {
	post, err := a.store.getPost(r.Context(), r.PathValue("slug"))
	// A draft doesn't exist as far as a visitor can tell.
	if errors.Is(err, errNotFound) || (err == nil && !post.Published && !a.signedIn(r)) {
		writeError(w, http.StatusNotFound, "No such post.")
		return
	}
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, post)
}

func (a *app) createPost(w http.ResponseWriter, r *http.Request) {
	var in postInput
	if !readJSON(w, r, &in) {
		return
	}
	if msg := in.check(); msg != "" {
		writeError(w, http.StatusUnprocessableEntity, msg)
		return
	}
	// With no address given, one is made from the title, and numbered if that one is taken.
	chosen := strings.TrimSpace(in.Slug) != ""
	slug := strings.TrimSpace(in.Slug)
	if !chosen {
		if slug = slugify(in.Title); slug == "" {
			slug = "post"
		}
	}
	if len(slug) > maxSlug || !slugPattern.MatchString(slug) {
		writeError(w, http.StatusUnprocessableEntity, "An address can only use lowercase letters, numbers and dashes.")
		return
	}
	for n := 1; ; n++ {
		try := slug
		if n > 1 {
			try = fmt.Sprintf("%s-%d", slug, n)
		}
		post, err := a.store.createPost(r.Context(), try, in.Title, in.Body, in.Published, a.now())
		if errors.Is(err, errExists) && !chosen && n < 50 {
			continue
		}
		if errors.Is(err, errExists) {
			writeError(w, http.StatusConflict, "That address is already in use.")
			return
		}
		if err != nil {
			a.fail(w, r, err)
			return
		}
		writeJSON(w, http.StatusCreated, post)
		return
	}
}

func (a *app) updatePost(w http.ResponseWriter, r *http.Request) {
	var in postInput
	if !readJSON(w, r, &in) {
		return
	}
	if msg := in.check(); msg != "" {
		writeError(w, http.StatusUnprocessableEntity, msg)
		return
	}
	post, err := a.store.updatePost(r.Context(), r.PathValue("slug"), in.Title, in.Body, in.Published, a.now())
	if errors.Is(err, errNotFound) {
		writeError(w, http.StatusNotFound, "No such post.")
		return
	}
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, post)
}

func (a *app) deletePost(w http.ResponseWriter, r *http.Request) {
	err := a.store.deletePost(r.Context(), r.PathValue("slug"))
	if errors.Is(err, errNotFound) {
		writeError(w, http.StatusNotFound, "No such post.")
		return
	}
	if err != nil {
		a.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

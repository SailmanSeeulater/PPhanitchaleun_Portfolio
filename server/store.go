package main

import (
	"context"
	"database/sql"
	_ "embed"
	"errors"
	"net/url"
	"strings"
	"time"
	"unicode/utf8"

	_ "modernc.org/sqlite" // SQLite written in Go: no C compiler needed to build for the server
)

//go:embed schema.sql
var schema string

var (
	errNotFound = errors.New("not found")
	errExists   = errors.New("slug already in use")
)

// Post is one entry in Lately. Body is Markdown, kept exactly as written; the site draws it.
type Post struct {
	Slug        string  `json:"slug"`
	Title       string  `json:"title"`
	Body        string  `json:"body"`
	Excerpt     string  `json:"excerpt"`
	Published   bool    `json:"published"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`
	PublishedAt *string `json:"publishedAt"`
}

type store struct{ db *sql.DB }

func openStore(path string) (*store, error) {
	// WAL lets a read go on while a write is in flight; the busy timeout makes a second writer wait, not fail.
	q := url.Values{}
	q.Add("_pragma", "journal_mode(WAL)")
	q.Add("_pragma", "busy_timeout(5000)")
	q.Add("_pragma", "synchronous(NORMAL)")
	db, err := sql.Open("sqlite", "file:"+path+"?"+q.Encode())
	if err != nil {
		return nil, err
	}
	// A couple of connections is plenty here, and each one costs memory on a small server.
	db.SetMaxOpenConns(2)
	if _, err := db.Exec(schema); err != nil {
		db.Close()
		return nil, err
	}
	return &store{db}, nil
}

func (s *store) close() error { return s.db.Close() }

func stamp(t time.Time) string { return t.UTC().Format(time.RFC3339) }

const postColumns = "slug, title, body, published, created_at, updated_at, published_at"

func scanPost(row interface{ Scan(...any) error }) (Post, error) {
	var p Post
	var publishedAt sql.NullString
	if err := row.Scan(&p.Slug, &p.Title, &p.Body, &p.Published, &p.CreatedAt, &p.UpdatedAt, &publishedAt); err != nil {
		return p, err
	}
	if publishedAt.Valid {
		p.PublishedAt = &publishedAt.String
	}
	p.Excerpt = excerptOf(p.Body)
	return p, nil
}

// listPosts returns the newest published posts first. With drafts, the drafts come before them.
// The list carries each post's excerpt, not its whole body.
func (s *store) listPosts(ctx context.Context, drafts bool) ([]Post, error) {
	query := "SELECT " + postColumns + " FROM posts"
	if !drafts {
		query += " WHERE published = 1"
	}
	query += " ORDER BY published ASC, COALESCE(published_at, updated_at) DESC, id DESC"
	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	posts := []Post{}
	for rows.Next() {
		p, err := scanPost(rows)
		if err != nil {
			return nil, err
		}
		p.Body = ""
		posts = append(posts, p)
	}
	return posts, rows.Err()
}

func (s *store) getPost(ctx context.Context, slug string) (Post, error) {
	p, err := scanPost(s.db.QueryRowContext(ctx, "SELECT "+postColumns+" FROM posts WHERE slug = ?", slug))
	if errors.Is(err, sql.ErrNoRows) {
		return p, errNotFound
	}
	return p, err
}

func (s *store) createPost(ctx context.Context, slug, title, body string, published bool, now time.Time) (Post, error) {
	var publishedAt any
	if published {
		publishedAt = stamp(now)
	}
	res, err := s.db.ExecContext(ctx,
		"INSERT INTO posts (slug, title, body, published, created_at, updated_at, published_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(slug) DO NOTHING",
		slug, title, body, published, stamp(now), stamp(now), publishedAt)
	if err != nil {
		return Post{}, err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return Post{}, errExists
	}
	return s.getPost(ctx, slug)
}

// updatePost rewrites a post. Its publish date is set the first time it goes public and kept after that.
func (s *store) updatePost(ctx context.Context, slug, title, body string, published bool, now time.Time) (Post, error) {
	res, err := s.db.ExecContext(ctx,
		"UPDATE posts SET title = ?, body = ?, published = ?, updated_at = ?, published_at = CASE WHEN ? AND published_at IS NULL THEN ? ELSE published_at END WHERE slug = ?",
		title, body, published, stamp(now), published, stamp(now), slug)
	if err != nil {
		return Post{}, err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return Post{}, errNotFound
	}
	return s.getPost(ctx, slug)
}

func (s *store) deletePost(ctx context.Context, slug string) error {
	res, err := s.db.ExecContext(ctx, "DELETE FROM posts WHERE slug = ?", slug)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return errNotFound
	}
	return nil
}

func (s *store) countPosts(ctx context.Context) (int, error) {
	var n int
	err := s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM posts").Scan(&n)
	return n, err
}

// Sessions. Expired ones are swept out whenever a new one is made.
func (s *store) createSession(ctx context.Context, tokenHash string, expires, now time.Time) error {
	if _, err := s.db.ExecContext(ctx, "DELETE FROM sessions WHERE expires_at <= ?", stamp(now)); err != nil {
		return err
	}
	_, err := s.db.ExecContext(ctx, "INSERT INTO sessions (token_hash, expires_at) VALUES (?, ?)", tokenHash, stamp(expires))
	return err
}

func (s *store) sessionLive(ctx context.Context, tokenHash string, now time.Time) (bool, error) {
	var n int
	err := s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM sessions WHERE token_hash = ? AND expires_at > ?", tokenHash, stamp(now)).Scan(&n)
	return n > 0, err
}

func (s *store) deleteSession(ctx context.Context, tokenHash string) error {
	_, err := s.db.ExecContext(ctx, "DELETE FROM sessions WHERE token_hash = ?", tokenHash)
	return err
}

// backup writes a complete, compacted copy of the database to path. Safe while the server is running.
func (s *store) backup(ctx context.Context, path string) error {
	_, err := s.db.ExecContext(ctx, "VACUUM INTO ?", path)
	return err
}

// excerptOf is the start of a post's first paragraph, with the Markdown marks taken out, for the list of posts.
func excerptOf(body string) string {
	const limit = 180
	for _, line := range strings.Split(body, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		line = strings.TrimLeft(line, "-*> ")
		line = strings.NewReplacer("**", "", "[[", "", "]]", "", "`", "").Replace(line)
		if utf8.RuneCountInString(line) <= limit {
			return line
		}
		cut := string([]rune(line)[:limit])
		if i := strings.LastIndex(cut, " "); i > limit/2 {
			cut = cut[:i]
		}
		return strings.TrimRight(cut, " ,.;:") + "…"
	}
	return ""
}

# Putting the Lately server on the VPS

The site is static files; Lately's posts come from a small Go server (`server/`) that nginx passes `/api/` to.
The deploy workflow builds that server and uploads it on every push to `main`, but only once the pieces below
are in place. Until then it skips the upload and says so, and Lately on the site shows as empty.

Do these once. Lines starting with `mac$` run on the Mac, in this repo; `vps$` on the server.

## 1. Make the admin password's hash

    mac$ cd server && go run . -hash

It asks for a password twice (at least 12 characters) and prints one line starting `API_ADMIN_HASH=`. Keep
that line for step 2. The password itself is stored nowhere.

## 2. The service's user, folders and settings

    vps$ sudo useradd --system --no-create-home --shell /usr/sbin/nologin portfolio-api
    vps$ sudo install -d -m 755 /opt/portfolio-api
    vps$ sudo install -d -m 700 /etc/portfolio-api
    vps$ sudo install -m 600 /dev/null /etc/portfolio-api/env
    vps$ sudoedit /etc/portfolio-api/env        # paste the API_ADMIN_HASH line, quotes and all

## 3. The service

    mac$ scp deploy/portfolio-api.service ubuntu@146.235.217.254:/tmp/
    vps$ sudo install -m 644 /tmp/portfolio-api.service /etc/systemd/system/
    vps$ sudo systemctl daemon-reload
    vps$ sudo systemctl enable portfolio-api

Enabled, not started: the program itself arrives in step 5.

## 4. nginx

`deploy/nginx-api.conf` has two pieces. Put the `limit_req_zone` line in a new file,
`/etc/nginx/conf.d/portfolio-api.conf`, and the two `location` blocks inside the `server` block for
latesailor.dev. Then:

    vps$ sudo nginx -t && sudo systemctl reload nginx

## 5. Upload and start

Run the deploy: push to `main`, or GitHub → Actions → "Deploy to VPS" → Run workflow. It uploads the program
to `/opt/portfolio-api/` and starts the service. Then check:

    mac$ curl https://latesailor.dev/api/posts
    {"posts":[]}

    vps$ systemctl status portfolio-api          # "active (running)", and how much memory it's using
    vps$ journalctl -u portfolio-api -n 30       # its log

To write, open Lately on the site and choose "Sign in" at the bottom of its window.

## 6. A nightly copy of the database

The posts are one file, `/var/lib/portfolio-api/lately.db`. This keeps two weeks of nightly copies beside it:

    vps$ sudo tee /etc/cron.d/portfolio-api-backup <<'CRON'
    15 4 * * * portfolio-api mkdir -p /var/lib/portfolio-api/backups && API_DB=/var/lib/portfolio-api/lately.db /opt/portfolio-api/portfolio-api -backup /var/lib/portfolio-api/backups/lately-$(date +\%F).db && find /var/lib/portfolio-api/backups -name 'lately-*.db' -mtime +14 -delete
    CRON

Those copies are on the same disk as the original. Copy one somewhere else now and then.

## Later

- New password: repeat step 1, replace the line in `/etc/portfolio-api/env`, `sudo systemctl restart portfolio-api`.
  Every browser that was signed in is signed out.
- Working on it locally: `npm run api` beside `npm run dev`. The server prints a throwaway password each run.

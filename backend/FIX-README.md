# Why the app won't start (this is not a code bug)

Your logs show two separate problems, both caused by your local machine's
Docker setup, not by anything in this repository:

## 1. `password authentication failed for user "limitless"`

Postgres only applies `POSTGRES_USER` / `POSTGRES_PASSWORD` the **first time**
a data volume is created. Your local `postgres_data` volume was already
initialized (probably days ago, from `docker ps -a` showing the container is
"3 days old") with a password that no longer matches your current `.env`.

Fix: run `./fix-db.sh` in the `backend` folder. It stops the old container,
deletes the stale volume, and starts a brand new Postgres that matches
`DB_USER` / `DB_PASSWORD` in your `.env`.

If you have real data in that volume you don't want to lose, don't run the
script — instead connect to the running container and change the password
by hand:
```bash
docker exec -it system-postgres-1 psql -U postgres -c \
  "ALTER USER limitless WITH PASSWORD 'change_me';"
```

## 2. `dial tcp: lookup registry-1.docker.io on 127.0.2.3:53: i/o timeout`

This is your Docker daemon failing to resolve DNS when pulling
`node:20-alpine`. `127.0.2.3` is a local stub resolver (often `systemd-resolved`,
a VPN, or WSL's internal DNS) intercepting Docker's requests. This has
nothing to do with the app code — it happens before any of your files are
even read.

To confirm/fix on your host:
```bash
cat /etc/resolv.conf
sudo journalctl -u docker --since "10 minutes ago" --no-pager | tail -40
```
and make sure `/etc/docker/daemon.json` has:
```json
{ "dns": ["8.8.8.8", "1.1.1.1"] }
```
then `sudo systemctl restart docker`.

If it's still stuck after that, the Postgres/Redis images are likely already
cached locally (they're small and older), so you can get the DB running with
`./fix-db.sh` even while the `api` image build is still blocked on DNS —
that at least confirms the credentials issue is separate from the DNS issue.

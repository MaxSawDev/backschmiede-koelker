# 🥨 Backschmiede Kölker - Website

Willkommen im Ofen unserer digitalen Backstube!  
Hier entsteht der frische Quellcode für [Backschmiede Kölker](https://backschmiede-koelker.de) - von Hand geknetet, mit Liebe gebacken und direkt heiß aus dem GitHub-Ofen serviert.  

---

## Getting Started

### Start localhost (self-contained):

Starte direkt lokal mit localhost!

1. EINMALIG: Neue lokale Env-Datei anlegen und Variablen setzen:
```bash
Copy-Item .\.env.localhost.example .\.env.localhost
```
2. Self-contained Stack starten:
```bash
docker compose `
  --env-file ".\.env.localhost" `
  -f ".\compose.localhost.yml" `
  up
```
3. Website öffnen:
```bash
http://localhost:3000
```

Hinweise:
- Für die localhost-Variante sollte `UPLOAD_DIR` in `.env.localhost` auf `/uploads_localhost` zeigen.
- `compose.localhost.yml` mountet dafür den Repo-Ordner `./uploads_localhost` in den Container.
- Die öffentliche URL bleibt im localhost-Fall trotzdem `/uploads/...`; `UPLOAD_DIR` steuert nur den Speicherort auf dem Dateisystem.


### Stop localhost (self-contained):

```bash
docker compose `
  --env-file ".\.env.localhost" `
  -f ".\compose.localhost.yml" `
  down
```



### Start local:

1. Connect with VPN -> even if already in Network, you need the VPN IP!!!

2. Start traefik_local:
```bash
docker compose `
  --env-file "C:\Repository\ServerSoftware\webserver-02\traefik\.env.local" `
  -f "C:\Repository\ServerSoftware\webserver-02\traefik\compose.local.yml" `
  up -d
```
3. Start postgres_local:
```bash
docker compose `
  --env-file "C:\Repository\ServerSoftware\webserver-02\postgresql\.env.local" `
  -f "C:\Repository\ServerSoftware\webserver-02\postgresql\compose.local.yml" `
  up -d
```
4. Start cdn_local:
```bash
docker compose `
  --env-file "C:\Repository\ServerSoftware\webserver-02\cdn\.env.local" `
  -f "C:\Repository\ServerSoftware\webserver-02\cdn\compose.local.yml" `
  up -d
```
5. Start redis:
```bash
docker compose `
  --env-file "C:\Repository\ServerSoftware\webserver-02\redis\.env.prod" `
  -f "C:\Repository\ServerSoftware\webserver-02\redis\compose.yml" `
  up -d
```
6. Start backschmiede-koelker_local:
```bash
# prisma generate for VS Code:
npx dotenv -e .env.local -- prisma generate

# delete .docker-npm.stamp and start command for new packages:
docker compose `
  --env-file ".\.env.local" `
  -f ".\compose.local.yml" `
  run --rm backschmiede-koelker_local sh -lc "[ -f .docker-npm.stamp ] || (npm ci --prefer-offline --no-audit --loglevel=warn && npx prisma generate && touch .docker-npm.stamp); npx prisma generate; npx prisma migrate dev"

# start website:
docker compose --env-file ".\.env.local" -f ".\compose.local.yml" up

# On Err "network not found":
docker compose --env-file .\.env.local -f .\compose.local.yml up --force-recreate

# Build inside container:
docker compose --env-file ".\.env.local" -f compose.local.yml exec -e NODE_ENV=production backschmiede-koelker_local sh -lc 'npm run build'
# Build outside container:
npm run build:no-db
```


### Stop local:

1. Stop backschmiede-koelker_local:
Strg + C 
oder
```bash
docker compose `
  --env-file ".\.env.local" `
  -f ".\compose.local.yml" `
  down
```
2. Stop redis:
```bash
docker compose `
  --env-file "C:\Repository\ServerSoftware\webserver-02\redis\.env.prod" `
  -f "C:\Repository\ServerSoftware\webserver-02\redis\compose.yml" `
  down
```
3. Stop cdn_local:
```bash
docker compose `
  --env-file "C:\Repository\ServerSoftware\webserver-02\cdn\.env.local" `
  -f "C:\Repository\ServerSoftware\webserver-02\cdn\compose.local.yml" `
  down
```
4. Stop postgres_local:
```bash
docker compose `
  --env-file "C:\Repository\ServerSoftware\webserver-02\postgresql\.env.local" `
  -f "C:\Repository\ServerSoftware\webserver-02\postgresql\compose.local.yml" `
  down
```
5. Stop traefik_local:
```bash
docker compose `
  --env-file "C:\Repository\ServerSoftware\webserver-02\traefik\.env.local" `
  -f "C:\Repository\ServerSoftware\webserver-02\traefik\compose.local.yml" `
  down
```
6. Disconnect VPN



### Start prod services with:

The production container reads application settings and secrets from
`.env.prod`. The upload directory on the host must be writable by UID/GID 1000:

```bash
sudo install -d -o 1000 -g 1000 -m 755 /srv/backschmiede-koelker.de/uploads
sudo docker compose -f compose.yml up -d
```

### Start prod website with cicd:
Merge changes into main, GitHub Actions will update the site.

Without an image override, `compose.yml` keeps using
`ghcr.io/backschmiede-koelker/backschmiede-koelker.de:latest` with pull policy
`always`, so the existing CI/CD behavior is unchanged.

### Deploy a locally built image without a runner

No second Compose file is required. `IMAGE_REFERENCE` and `IMAGE_PULL_POLICY`
select either the CI image or an image that was loaded manually.

Build and export the Linux image on the development machine (PowerShell):

```powershell
$Tag = "backschmiede-koelker:restore-local"

docker build `
  --platform linux/amd64 `
  --build-arg NEXT_PUBLIC_BASE_ASSET_URL=https://cdn.backschmiede-koelker.de `
  --build-arg NEXT_PUBLIC_BASE_URL=https://backschmiede-koelker.de `
  --tag $Tag `
  .

docker save --output backschmiede-koelker.restore-local.tar $Tag
scp .\backschmiede-koelker.restore-local.tar webserver-02:/srv/rescue/images/
```

On the server, create the non-secret deployment selector once, load the image,
and explicitly prevent network pulls:

```bash
cd /srv/backschmiede-koelker.de
cp .env.deploy.example .env.deploy
chmod 600 .env.deploy .env.prod

sudo docker load --input /srv/rescue/images/backschmiede-koelker.restore-local.tar
sudo docker compose --env-file .env.deploy -f compose.yml config --images
sudo docker compose --env-file .env.deploy -f compose.yml up -d --pull never
sudo docker compose --env-file .env.deploy -f compose.yml ps
```

Run migrations explicitly after a database restore and before publishing the
site. Migrations do not seed or replace user accounts:

```bash
sudo docker compose --env-file .env.deploy -f compose.yml exec -T \
  backschmiede-koelker ./node_modules/.bin/prisma migrate deploy
```

Use the same `--env-file .env.deploy` option for every Compose command while a
manually loaded image is active. Removing that option returns to the CI
defaults.



## How to change admin password:

`prisma db seed` is intentionally not executed by CI and is disabled by
default. It never deletes other users. To create a missing admin, use mode
`create`; to change the password of exactly one existing username, use mode
`update` explicitly:

```bash
cd /srv/backschmiede-koelker.de
read -r -p "Admin username: " ADMIN_USERNAME
read -r -s -p "New admin password: " ADMIN_PASSWORD
printf '\n'

sudo docker compose --env-file .env.deploy -f compose.yml exec -T \
  -e ADMIN_SEED_MODE=update \
  -e ADMIN_USERNAME="$ADMIN_USERNAME" \
  -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  backschmiede-koelker ./node_modules/.bin/prisma db seed

unset ADMIN_USERNAME ADMIN_PASSWORD
```

Use `ADMIN_SEED_MODE=create` instead when the username must only be created if
it does not exist. Keep `ADMIN_SEED_MODE=off` in `.env.prod` during normal
starts and restores.

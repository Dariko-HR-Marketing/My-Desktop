#!/usr/bin/env bash
# One-time server preparation (Ubuntu 24.04). Run as root:
#   DEPLOY_PUBKEY="$(cat deploy_key.pub)" DOMAIN=my-desk.tajriba24.uz bash setup-server.sh
# Safe to re-run. Secrets are generated on the server and never leave it.
set -euo pipefail

APP_DIR=/opt/my-desktop
DOMAIN="${DOMAIN:?set DOMAIN, e.g. my-desk.tajriba24.uz}"
DEPLOY_PUBKEY="${DEPLOY_PUBKEY:?set DEPLOY_PUBKEY to the public half of the GitHub deploy key}"
[ "$(id -u)" -eq 0 ] || { echo "Run as root"; exit 1; }

echo "== Checking ports 80/443 =="
if ss -tlnH '( sport = :80 or sport = :443 )' | grep -q .; then
  if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^my-desktop-caddy'; then
    echo "Ports 80/443 are already in use by another service:"
    ss -tlnp '( sport = :80 or sport = :443 )'
    echo "Stop it or put it behind this proxy first. Aborting."
    exit 1
  fi
fi

echo "== Packages =="
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg ufw rsync fail2ban openssl

echo "== Docker =="
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

echo "== Swap 2 GB =="
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "== deploy user =="
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
grep -qxF "$DEPLOY_PUBKEY" /home/deploy/.ssh/authorized_keys || echo "$DEPLOY_PUBKEY" >> /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
install -d -o deploy -g deploy "$APP_DIR" "$APP_DIR/deploy" "$APP_DIR/backups"

echo "== deploy/.env =="
ENV_FILE="$APP_DIR/deploy/.env"
if [ ! -f "$ENV_FILE" ]; then
  ADMIN_PASSWORD="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-16)"
  umask 077
  cat > "$ENV_FILE" <<EOF
DOMAIN=$DOMAIN
POSTGRES_PASSWORD=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 48)
SEED_ADMIN_PASSWORD=$ADMIN_PASSWORD
JWT_EXPIRES_IN=12h
CORS_ORIGINS=tauri://localhost,http://tauri.localhost
EOF
  chown deploy:deploy "$ENV_FILE"
  echo "Created $ENV_FILE. First admin login: admin / $ADMIN_PASSWORD  (change it after signing in)"
else
  echo "$ENV_FILE already exists, left untouched"
fi

echo "== Firewall =="
ufw allow 22/tcp >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null

echo "== Daily database backup (7 days) =="
cat > /etc/cron.d/my-desktop-backup <<EOF
17 3 * * * deploy cd $APP_DIR/deploy && docker compose exec -T postgres pg_dump -U ishmaydoni ishmaydoni | gzip > $APP_DIR/backups/db-\$(date +\%F).sql.gz && find $APP_DIR/backups -name 'db-*.sql.gz' -mtime +7 -delete
EOF

echo "== SSH hardening =="
if [ "${HARDEN_SSH:-no}" = "yes" ]; then
  cat > /etc/ssh/sshd_config.d/99-my-desktop.conf <<'EOF'
PasswordAuthentication no
PermitRootLogin prohibit-password
EOF
  systemctl reload ssh
  echo "Password login disabled. Make sure key login works in ANOTHER terminal before closing this one."
else
  echo "Skipped. After confirming 'ssh deploy@HOST' works with the key, re-run with HARDEN_SSH=yes."
fi

echo "Done. Next: run the 'Deploy server' workflow in GitHub Actions."

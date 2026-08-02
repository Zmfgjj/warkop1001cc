#!/bin/bash
# =========================================================
# VPS 1GB RAM Cleanup, Optimization & Backend Setup Script
# =========================================================

echo "0. Cleaning up old projects & processes..."
# Stop PM2 processes if running
if command -v pm2 &> /dev/null; then
    pm2 stop all 2>/dev/null
    pm2 delete all 2>/dev/null
fi

# Clean web directories and temporary files
rm -rf /var/www/*
rm -rf /root/app /root/project /tmp/* 2>/dev/null
echo "Old project files cleaned!"

echo "1. Creating 2GB Swap Memory..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "Swap setup complete!"
else
    echo "Swapfile already exists."
fi

echo "2. Installing Node.js, PM2 & Nginx..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs nginx mariadb-server unzip
npm install -g pm2

echo "3. Tuning MySQL for 1GB RAM..."
MYSQL_CONF="/etc/mysql/mariadb.conf.d/50-server.cnf"
if [ ! -f "$MYSQL_CONF" ]; then
    MYSQL_CONF="/etc/mysql/my.cnf"
fi

if ! grep -q "innodb_buffer_pool_size = 128M" "$MYSQL_CONF"; then
cat <<EOT >> $MYSQL_CONF

[mysqld]
innodb_buffer_pool_size = 128M
innodb_log_buffer_size = 8M
max_connections = 50
performance_schema = OFF
EOT
fi

systemctl restart mysql || systemctl restart mariadb
echo "MySQL tuned successfully!"

echo "4. Setting up Nginx Reverse Proxy & Static Image Serving..."
cat <<'EOT' > /etc/nginx/sites-available/warkop
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    # Static file serving for Menu photos directly via Nginx
    location /uploads/ {
        alias /var/www/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Reverse proxy to Node.js / Express backend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOT

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/warkop /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
echo "Nginx configured successfully!"

echo "========================================================="
echo "VPS Cleanup & Setup Completed!"
echo "Next step: Extract backend to /var/www/backend, run 'npm install --omit=dev', configure .env, then 'pm2 start src/app.js --name warkop-backend --max-memory-restart 200M'"
echo "========================================================="

# SSL Certificates
# Place your SSL certificates here:
# - cert.pem (certificate)
# - key.pem (private key)

# For self-signed certificates (testing):
# openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#   -keyout ssl/key.pem -out ssl/cert.pem \
#   -subj "/C=GT/ST=Guatemala/L=Guatemala/O=Teknao/OU=CRM/CN=localhost"

# For Let's Encrypt (production):
# sudo certbot certonly --standalone -d yourdomain.com
# sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
# sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem

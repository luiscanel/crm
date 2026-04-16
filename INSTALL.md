# 🚀 Teknao CRM - Guía de Instalación desde Cero

Esta guía te lleva desde cero hasta tener el CRM funcionando.

---

## 1. Instalar Docker y Docker Compose

### En Ubuntu/Debian:
```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y ca-certificates curl gnupg

# Agregar repositorio Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Habilitar Docker al inicio
sudo systemctl enable docker
sudo systemctl start docker

# Verificar instalación
docker --version
docker-compose --version
```

### En CentOS/RHEL:
```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
```

### En Windows (WSL2):
1. Descarga **Docker Desktop** desde https://www.docker.com/products/docker-desktop/
2. Instala y ejecuta
3. En WSL2: `docker --version`

---

## 2. Clonar el Proyecto

```bash
# Instalar git si no lo tienes
sudo apt install -y git

# Clonar el repositorio
git clone https://github.com/luiscanel/crm.git
cd crm
```

---

## 3. Configurar Variables de Entorno

```bash
# Editar el archivo .env
nano backend/.env
```

Modifica estos valores:
- `JWT_SECRET` - Genera una clave segura única
- `CORS_ORIGINS` - Cambia por tu dominio si tienes

Ejemplo para generar clave segura:
```bash
openssl rand -base64 32
```

---

## 4. Construir y Ejecutar

```bash
# Construir contenedores (primera vez)
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ver estado
docker-compose ps
```

---

## 5. Verificar Funcionamiento

```bash
# Probar backend
curl http://localhost:3001/api/health

# Ver logs
docker-compose logs -f backend
```

**Respuesta esperada:**
```json
{"success":true,"message":"Teknao CRM API running","timestamp":"2026-04-16T..."}
```

---

## 6. Acceder al CRM

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost |
| API | http://localhost:3001 |
| Docs | http://localhost:3001/api/docs |

**Credenciales:**
- Email: `luis.c@teknao.com.gt`
- Contraseña: `admin123`

---

## 7. Comandos Útiles

```bash
# Detener servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Ver logs de un servicio
docker-compose logs -f backend

# Ver uso de recursos
docker stats

# Actualizar con cambios de GitHub
git pull origin master
docker-compose build
docker-compose up -d
```

---

## 8. Configurar Dominio (Opcional)

Si tienes un dominio:

1. Configura DNS pointing a tu servidor
2. Edita `frontend/nginx.conf`:
```nginx
server_name tudominio.com;
```
3. Reinicia:
```bash
docker-compose down
docker-compose up -d
```

---

## 9. Migrar Datos Existentes

Si tienes datos del CRM anterior:

```bash
# En el servidor actual
cp backend/data/crm.db /ruta/backup/crm.db

# Copiar al nuevo servidor
scp /ruta/backup/crm.db usuario@nuevo-servidor:/home/usuario/crm/backend/data/
```

---

## 10. Puertos Requeridos

| Puerto | Servicio |
|--------|----------|
| 80 | Frontend Nginx |
| 3001 | Backend API |
| 5376-5378 | Docker interno |

---

## 🚨 Solución de Problemas

### Error: "port is already allocated"
```bash
# Ver qué usa el puerto 80
sudo lsof -i :80
# O cambiar puerto en docker-compose.yml
```

### Error: "Cannot connect to Docker daemon"
```bash
# Agregar usuario a grupo docker
sudo usermod -aG docker $USER
# Cerrar sesión y volver a entrar
```

### Ver logs de errores
```bash
docker-compose logs backend --tail=100
```

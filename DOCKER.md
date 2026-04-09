# Teknao CRM - Docker Setup

## Archivos Docker

| Archivo | Descripción |
|---------|-------------|
| `backend/Dockerfile` | Imagen Node 18 para backend |
| `frontend/Dockerfile` | Imagen Node 18 + Vite (desarrollo) |
| `frontend/Dockerfile.prod` | Build + Nginx (producción) |
| `docker-compose.yml` | Orquestación de servicios |

## Puertos

| Servicio | Puerto | URL |
|----------|--------|-----|
| Backend | 3001 | http://localhost:3001 |
| Frontend (dev) | 5173 | http://localhost:5173 |
| Frontend (prod) | 80 | http://localhost |

## Desarrollo

```bash
# Iniciar servicios
docker-compose up --build

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

## Producción

```bash
# Iniciar producción
docker-compose up --build frontend-prod

# Escalar
docker-compose up -d --scale backend=2
```

## Credenciales

- **Admin:** admin@crm.com / admin123
- **Vendedor:** vendedor1@crm.com / admin123
# Manuel Déploiement et Mise à Jour

## Déploiement

```bash
# Backend
cd back/
npm install
npm run build
pm2 start dist/main.js --name sortir-api

# Frontend  
cd front/
npm install
npm run build
```

## Mise à Jour

```bash
# Sauvegarde
pg_dump sortir_db > backup.sql

# Mise à jour
git pull
cd back/ && npm install && npm run build
cd front/ && npm install && npm run build
pm2 restart sortir-api
```

## Rollback

```bash
git checkout HEAD~1
npm run build  
pm2 restart sortir-api
```
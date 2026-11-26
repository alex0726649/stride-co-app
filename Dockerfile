FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
# Render entrega config/local-production.json como secret file en /etc/secrets.
# Se enlaza al arrancar el contenedor (no al construir la imagen), así el secreto
# nunca queda dentro de la imagen y no se necesita otra variable de entorno.
CMD ["sh", "-c", "if [ -f /etc/secrets/local-production.json ]; then ln -sf /etc/secrets/local-production.json config/local-production.json; fi; exec node ./bin/www"]
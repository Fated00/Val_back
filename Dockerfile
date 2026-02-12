FROM node:20-alpine

WORKDIR /app

# Устанавливаем зависимости (только package*.json)
COPY package*.json ./
RUN npm install --omit=dev

# Копируем исходники
COPY . .

# Окружение по умолчанию
ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]


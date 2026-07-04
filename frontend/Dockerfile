# Frontend Dockerfile
FROM node:20-alpine AS build

WORKDIR /app

ARG REACT_APP_API_URL
ARG REACT_APP_SENTRY_DSN
ARG REACT_APP_SENTRY_ENVIRONMENT
ARG REACT_APP_SENTRY_TRACES_SAMPLE_RATE
ARG REACT_APP_VERSION
ARG REACT_APP_MATOMO_URL
ARG REACT_APP_MATOMO_SITE_ID

ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_SENTRY_DSN=$REACT_APP_SENTRY_DSN \
    REACT_APP_SENTRY_ENVIRONMENT=$REACT_APP_SENTRY_ENVIRONMENT \
    REACT_APP_SENTRY_TRACES_SAMPLE_RATE=$REACT_APP_SENTRY_TRACES_SAMPLE_RATE \
    REACT_APP_VERSION=$REACT_APP_VERSION \
    REACT_APP_MATOMO_URL=$REACT_APP_MATOMO_URL \
    REACT_APP_MATOMO_SITE_ID=$REACT_APP_MATOMO_SITE_ID

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS production

COPY --from=build /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

############################
# @author Elias De Hondt   #
# @see https://eliasdh.com #
# @since 01/01/2025        #
############################
# Frontend build
FROM nginx:alpine

LABEL maintainer="Elias De Hondt <elias.dehondt@outlook.com>"
LABEL version="1.0"
LABEL description="This is the frontend image for the app."
LABEL org.opencontainers.image.description="This is the frontend image for the app."

COPY ./nginx.conf /etc/nginx/nginx.conf

COPY ./assets /usr/share/nginx/html/assets

COPY ./index.html /usr/share/nginx/html/index.html
COPY ./manifest.json /usr/share/nginx/html/manifest.json
COPY ./robots.txt /usr/share/nginx/html/robots.txt
COPY ./sitemap.xml /usr/share/nginx/html/sitemap.xml

EXPOSE 80
FROM nginx:alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

COPY . /usr/share/nginx/html

RUN chmod -R a+r /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

FROM postgres:9.4
MAINTAINER Eric Rasche <rasche.eric@yandex.ru>

ENV POSTGRES_PASSWORD postgres
RUN mkdir -p /var/lib/postgresql/9.4/
ENV PGDATA /var/lib/postgresql/9.4/

COPY docker-entrypoint.sh /

ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 5432
CMD ["postgres"]
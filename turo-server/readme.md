### Set up postgres
- `brew install postgresql`
- `pg_ctl -D /usr/local/var/postgres start && brew services start postgresql`
- Check postgres is running: `postgres -V`
- `createdb turodev`
- `createuser postgres`
- Install knex globally `npm i -g knex`
- Migrate your db: `knex migrate:latest`

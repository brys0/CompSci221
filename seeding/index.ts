import { sql, SQL } from "bun";

const { MYSQL_DATABASE_HOST, MYSQL_DATABASE_USER, MYSQL_DATABSE_USER_PASSWORD } =
  process.env;

function validateEnvironment(): boolean {
  let shouldExit = false;
  if (!MYSQL_DATABASE_HOST) {
    console.error('You must have a MYSQL_DATABASE_HOST defined.');
    shouldExit = true;
  }

  if (!MYSQL_DATABASE_USER) {
    console.error('You must have a MYSQL_DATABASE_USER defined.');
    shouldExit = true;
  }

  if (!MYSQL_DATABSE_USER_PASSWORD) {
    console.error('You must have a MYSQL_DATABASE_USER_PASSWORD defined.');
    shouldExit = true;
  }

  return !shouldExit;
}

if (!validateEnvironment()) {
  process.exit(1);
}

// const conn = new SQL();

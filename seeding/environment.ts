declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MYSQL_DATABASE_HOST: string | undefined;
      MYSQL_DATABASE_USER: string | undefined;
      MYSQL_DATABASE_USER_PASSWORD: string | undefined;
    }
  }
}


export default global;
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MYSQL_DATABASE_HOST: string | undefined;
      MYSQL_DATABASE_USER: string | undefined;
      MYSQL_DATABASE_USER_PASSWORD: string | undefined;
    }
  }

  interface Identifiable {
    id: string;
  }

  interface Region extends Identifiable {
    name: string;
  }

  interface Platform extends Identifiable {
    name: string;
    released: number;
  }

  interface Game extends Identifiable {
    names: {
      international: string;
    };
    released: number;
    weblink: string;
    platforms: string[];
  }
  
  interface Category extends Identifiable {
    name: string;
    rules: string;
  }
}

export default global;

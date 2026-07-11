import { app } from "./app.js";
import { env, validateEnv } from "./config/env.js";

validateEnv();

app.listen(env.port, () => {
  console.log(`SIGDIM API disponible en http://localhost:${env.port}`);
});

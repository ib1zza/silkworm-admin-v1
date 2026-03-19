import { defineConfig } from "orval";

export default defineConfig({
  silkworm: {
    input: {
      target: "https://digital-twilight.ru/swagger/v1/swagger.json",
    },
    output: {
      mode: "tags", // 🔥 важно — разобьёт по сущностям
      target: "src/api/generated",
      schemas: "src/api/model",
      httpClient: "axios",
      client: "react-query", // 🔥 сразу интеграция с React Query
      override: {
        mutator: {
          path: "./src/api/axios.ts",
          name: "customAxios",
        },
      },
    },
  },
});

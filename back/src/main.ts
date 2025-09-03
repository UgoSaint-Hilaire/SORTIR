import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration ValidationPipe Global - Protection contre les injections
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: false,
      validationError: {
        target: false,
        value: false,
      },
    })
  );

  // Configuration CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Accepte toutes les requêtes Railway et localhost
      if (!origin || 
          origin.includes('railway.app') || 
          origin.includes('localhost') ||
          origin.includes('127.0.0.1')) {
        callback(null, true);
      } else if (process.env.FRONTEND_URL) {
        // Vérifie si l'origine est dans la liste autorisée
        const allowedOrigins = process.env.FRONTEND_URL.split(',');
        callback(null, allowedOrigins.includes(origin));
      } else {
        callback(null, false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, "0.0.0.0");
  console.log(`Application is running on port ${port}`);
}
bootstrap();

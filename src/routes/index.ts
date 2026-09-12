import { Router } from 'express';
import { cepRouter } from './cep.routes';
import { cnpjRouter } from './cnpj.routes';
import { healthRouter } from './health.routes';
import { holidaysRouter } from './holidays.routes';
import { locationRouter } from './location.routes';

export const healthRoutes = healthRouter;

export const apiV1Router = Router();

apiV1Router.use(cepRouter);
apiV1Router.use(locationRouter);
apiV1Router.use(holidaysRouter);
apiV1Router.use(cnpjRouter);

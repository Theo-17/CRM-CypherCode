import { Router } from 'express';
import healthCheck from './health-check.js';
import stripeRouter from './stripe.js';
import featuresRouter from './features.js';
import slackRouter from './slack.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.use('/stripe', stripeRouter);
    router.use('/features', featuresRouter);
    router.use('/slack', slackRouter);

    return router;
};
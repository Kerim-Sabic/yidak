import { t } from './init';
import { bidRouter } from './routers/bid';
import { chatRouter } from './routers/chat';
import { jobRouter } from './routers/job';
import { notificationRouter } from './routers/notification';
import { paymentRouter } from './routers/payment';
import { referralRouter } from './routers/referral';
import { reviewRouter } from './routers/review';
import { userRouter } from './routers/user';

export const appRouter = t.router({
  job: jobRouter,
  bid: bidRouter,
  user: userRouter,
  payment: paymentRouter,
  chat: chatRouter,
  review: reviewRouter,
  notification: notificationRouter,
  referral: referralRouter
});

export type AppRouter = typeof appRouter;

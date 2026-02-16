import { z } from 'zod';

declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type UserId = Brand<string, 'UserId'>;
export type JobId = Brand<string, 'JobId'>;
export type BidId = Brand<string, 'BidId'>;
export type PaymentId = Brand<string, 'PaymentId'>;
export type ConversationId = Brand<string, 'ConversationId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type ReviewId = Brand<string, 'ReviewId'>;
export type NotificationId = Brand<string, 'NotificationId'>;
export type CategoryId = Brand<string, 'CategoryId'>;
export type DisputeId = Brand<string, 'DisputeId'>;
export type ReferralId = Brand<string, 'ReferralId'>;

export const UserIdSchema = z.string().uuid().brand<'UserId'>();
export const JobIdSchema = z.string().uuid().brand<'JobId'>();
export const BidIdSchema = z.string().uuid().brand<'BidId'>();
export const PaymentIdSchema = z.string().uuid().brand<'PaymentId'>();
export const ConversationIdSchema = z.string().uuid().brand<'ConversationId'>();
export const MessageIdSchema = z.string().uuid().brand<'MessageId'>();
export const ReviewIdSchema = z.string().uuid().brand<'ReviewId'>();
export const NotificationIdSchema = z.string().uuid().brand<'NotificationId'>();
export const CategoryIdSchema = z.string().uuid().brand<'CategoryId'>();
export const DisputeIdSchema = z.string().uuid().brand<'DisputeId'>();
export const ReferralIdSchema = z.string().uuid().brand<'ReferralId'>();

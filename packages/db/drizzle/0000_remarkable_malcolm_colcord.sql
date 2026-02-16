CREATE TYPE "public"."bid_status" AS ENUM('pending', 'accepted', 'rejected', 'withdrawn', 'expired', 'outbid');--> statement-breakpoint
CREATE TYPE "public"."country_code" AS ENUM('AE', 'SA', 'QA', 'BH', 'KW', 'OM');--> statement-breakpoint
CREATE TYPE "public"."currency_code" AS ENUM('AED', 'SAR', 'QAR', 'BHD', 'KWD', 'OMR');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('open', 'under_review', 'resolved_customer', 'resolved_worker', 'escalated');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'posted', 'bidding', 'assigned', 'in_progress', 'completed', 'reviewed', 'cancelled', 'expired', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'image', 'voice', 'system', 'location');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('bid_placed', 'bid_accepted', 'message_received', 'job_assigned', 'job_completed', 'payment_status', 'review_received', 'system_alert', 'new_bid', 'outbid', 'job_posted', 'payment_authorized', 'payment_released', 'auction_ending', 'tier_upgrade', 'referral_credit');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'authorized', 'captured', 'voided', 'refunded', 'failed', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."preferred_gender" AS ENUM('any', 'male', 'female');--> statement-breakpoint
CREATE TYPE "public"."referral_reward_status" AS ENUM('pending', 'completed', 'credited', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."referral_reward_type" AS ENUM('cash', 'discount', 'credit');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('pending', 'qualified', 'credited', 'expired');--> statement-breakpoint
CREATE TYPE "public"."urgency_level" AS ENUM('flexible', 'normal', 'urgent', 'emergency');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'worker', 'admin');--> statement-breakpoint
CREATE TYPE "public"."worker_tier" AS ENUM('bronze', 'silver', 'gold', 'platinum');--> statement-breakpoint
CREATE TABLE "bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"amount" double precision NOT NULL,
	"currency" "currency_code" NOT NULL,
	"message" text,
	"estimated_duration_hours" integer NOT NULL,
	"status" "bid_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"initiated_by" uuid NOT NULL,
	"reason" text NOT NULL,
	"description" text NOT NULL,
	"evidence_urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "dispute_status" DEFAULT 'open' NOT NULL,
	"resolution_notes" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"icon" text,
	"description_en" text,
	"description_ar" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"assigned_worker_id" uuid,
	"accepted_bid_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category_id" uuid NOT NULL,
	"location" geography(Point,4326) NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"area" text,
	"building" text,
	"country" "country_code" NOT NULL,
	"budget_min" double precision NOT NULL,
	"budget_max" double precision NOT NULL,
	"urgency" "urgency_level" DEFAULT 'normal' NOT NULL,
	"status" "job_status" DEFAULT 'posted' NOT NULL,
	"bid_count" integer DEFAULT 0 NOT NULL,
	"lowest_bid" double precision,
	"expires_at" timestamp with time zone,
	"scheduled_date" timestamp with time zone,
	"photos" text[] DEFAULT '{}'::text[] NOT NULL,
	"preferred_gender" "preferred_gender" DEFAULT 'any' NOT NULL,
	"completed_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"views_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"type" "message_type" DEFAULT 'text' NOT NULL,
	"metadata" jsonb,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"amount" double precision NOT NULL,
	"currency" "currency_code" NOT NULL,
	"platform_fee" double precision NOT NULL,
	"worker_payout" double precision NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_checkout_session_id" text,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"metadata" jsonb,
	"authorized_at" timestamp with time zone,
	"captured_at" timestamp with time zone,
	"voided_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"uses_count" integer DEFAULT 0 NOT NULL,
	"max_uses" integer DEFAULT 200 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referral_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" uuid NOT NULL,
	"referee_id" uuid NOT NULL,
	"code_id" uuid NOT NULL,
	"reward_type" "referral_reward_type" DEFAULT 'cash' NOT NULL,
	"reward_amount" double precision DEFAULT 0 NOT NULL,
	"status" "referral_reward_status" DEFAULT 'pending' NOT NULL,
	"credited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"reviewee_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"quality_rating" integer NOT NULL,
	"timeliness_rating" integer NOT NULL,
	"communication_rating" integer NOT NULL,
	"value_rating" integer NOT NULL,
	"cleanliness_rating" integer NOT NULL,
	"comment" text,
	"photos" text[] DEFAULT '{}' NOT NULL,
	"response" text,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_id" uuid NOT NULL,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"avatar_url" text,
	"stripe_customer_id" text,
	"country" "country_code" NOT NULL,
	"city" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "profiles_auth_id_unique" UNIQUE("auth_id"),
	CONSTRAINT "profiles_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" uuid NOT NULL,
	"referee_id" uuid NOT NULL,
	"code" text NOT NULL,
	"reward_amount" double precision DEFAULT 0 NOT NULL,
	"reward_currency" "currency_code" DEFAULT 'AED' NOT NULL,
	"status" "referral_status" DEFAULT 'pending' NOT NULL,
	"credited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "worker_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"bio" text,
	"skills" text[] DEFAULT '{}'::text[] NOT NULL,
	"certifications" jsonb[] DEFAULT '{}'::jsonb[] NOT NULL,
	"portfolio_photos" text[] DEFAULT '{}'::text[] NOT NULL,
	"location" geography(Point,4326) NOT NULL,
	"service_radius_km" double precision DEFAULT 10 NOT NULL,
	"hourly_rate_min" double precision DEFAULT 0 NOT NULL,
	"hourly_rate_max" double precision DEFAULT 0 NOT NULL,
	"tier" "worker_tier" DEFAULT 'bronze' NOT NULL,
	"total_jobs" integer DEFAULT 0 NOT NULL,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"total_earnings" double precision DEFAULT 0 NOT NULL,
	"average_rating" double precision DEFAULT 0 NOT NULL,
	"response_time_minutes" integer DEFAULT 0 NOT NULL,
	"completion_rate" double precision DEFAULT 0 NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"availability_schedule" jsonb,
	"stripe_connect_id" text,
	"stripe_onboarding_complete" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "worker_profiles_stripe_connect_id_unique" UNIQUE("stripe_connect_id")
);
--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_worker_id_profiles_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_initiated_by_profiles_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_profiles_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_categories" ADD CONSTRAINT "job_categories_parent_id_job_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."job_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_customer_id_profiles_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_assigned_worker_id_profiles_id_fk" FOREIGN KEY ("assigned_worker_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_category_id_job_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_id_profiles_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_worker_id_profiles_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_profiles_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_worker_id_profiles_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referrer_id_profiles_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referee_id_profiles_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_code_id_referral_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."referral_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_profiles_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewee_id_profiles_id_fk" FOREIGN KEY ("reviewee_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_profiles_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_profiles_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD CONSTRAINT "worker_profiles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bids_job_id_amount_idx" ON "bids" USING btree ("job_id","amount");--> statement-breakpoint
CREATE INDEX "bids_worker_id_status_idx" ON "bids" USING btree ("worker_id","status");--> statement-breakpoint
CREATE INDEX "bids_job_id_status_idx" ON "bids" USING btree ("job_id","status");--> statement-breakpoint
CREATE INDEX "jobs_status_city_idx" ON "jobs" USING btree ("status","city");--> statement-breakpoint
CREATE INDEX "jobs_customer_id_idx" ON "jobs" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "jobs_category_status_idx" ON "jobs" USING btree ("category_id","status");--> statement-breakpoint
CREATE INDEX "jobs_status_expires_at_idx" ON "jobs" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "messages_conversation_created_at_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_read_created_at_idx" ON "notifications" USING btree ("user_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_recent_idx" ON "notifications" USING btree ("user_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX "referral_codes_user_created_idx" ON "referral_codes" USING btree ("user_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX "referral_rewards_referrer_status_idx" ON "referral_rewards" USING btree ("referrer_id","status","created_at" DESC);--> statement-breakpoint
CREATE INDEX "referral_rewards_referee_created_idx" ON "referral_rewards" USING btree ("referee_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX "referral_rewards_code_idx" ON "referral_rewards" USING btree ("code_id");--> statement-breakpoint
CREATE INDEX "reviews_reviewee_rating_idx" ON "reviews" USING btree ("reviewee_id","rating");--> statement-breakpoint
CREATE INDEX "worker_profiles_location_idx" ON "worker_profiles" USING gist ("location");
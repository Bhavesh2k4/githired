-- Add companies table
CREATE TABLE IF NOT EXISTS "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"logo_url" text,
	"website_url" text,
	"location" text,
	"about" text,
	"industry" text,
	"size" text,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"linkedin_url" text,
	"twitter_url" text,
	"founded_year" text,
	"specialties" text[] DEFAULT '{}',
	"benefits" jsonb DEFAULT '[]',
	"culture" text,
	"tech_stack" text[] DEFAULT '{}',
	"office_locations" jsonb DEFAULT '[]',
	"verified" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"analytics" jsonb DEFAULT '{"profileViews":0,"jobPosts":0,"applications":0}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade
);

-- Add index for companies status and created_at
CREATE INDEX IF NOT EXISTS "idx_companies_status_created_at" ON "companies" ("status", "created_at" DESC);

-- Update user table role comment
COMMENT ON COLUMN "user"."role" IS 'student | company | admin';


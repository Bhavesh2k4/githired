import { relations, sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').$defaultFn(() => false).notNull(),
    image: text('image'),
    role: text('role').$defaultFn(() => 'student').notNull(), // student | company | admin
    createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
    updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull()
});

export const session = pgTable("session", {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable("account", {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()),
    updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date())
});

export const students = pgTable("students", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
    srn: text('srn').unique(), // student registration number
    srnValid: boolean('srn_valid').$defaultFn(() => false),
    phone: text('phone'),
    email: text('email').notNull(),
    location: text('location'),
    preferredLocations: text('preferred_locations').array().$defaultFn(() => []),
    bio: text('bio'),
    aboutMe: text('about_me'),
    headline: text('headline'),
    education: jsonb('education').$defaultFn(() => []),
    experience: jsonb('experience').$defaultFn(() => []),
    projects: jsonb('projects').$defaultFn(() => []),
    certifications: jsonb('certifications').$defaultFn(() => []),
    achievements: jsonb('achievements').$defaultFn(() => []),
    skills: text('skills').array().$defaultFn(() => []),
    githubUrl: text('github_url'),
    linkedinUrl: text('linkedin_url'),
    portfolioUrl: text('portfolio_url'),
    leetcodeUrl: text('leetcode_url'),
    otherPlatforms: jsonb('other_platforms').$defaultFn(() => ({})),
    analytics: jsonb('analytics').$defaultFn(() => ({ profileViews: 0, applications: 0 })),
    placedIntern: boolean('placed_intern').$defaultFn(() => false),
    placedFte: boolean('placed_fte').$defaultFn(() => false),
    resumeUrl: text('resume_url'), // Kept for backward compatibility
    resumes: jsonb('resumes').$defaultFn(() => []), // Array of {label: string, url: string, uploadedAt: string}
    status: text('status').$defaultFn(() => 'pending').notNull(), // pending | approved | rejected | banned
    adminNote: text('admin_note'),
    createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
    updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => ({
    statusCreatedAtIdx: index('idx_students_status_created_at').on(table.status, table.createdAt.desc())
}));

export const studentRelations = relations(students, ({ one }) => ({
    user: one(user, {
        fields: [students.userId],
        references: [user.id]
    })
}));

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

export const companies = pgTable("companies", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    logoUrl: text('logo_url'),
    websiteUrl: text('website_url'),
    location: text('location'),
    about: text('about'),
    industry: text('industry'),
    size: text('size'), // e.g., "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"
    contactEmail: text('contact_email').notNull(),
    contactPhone: text('contact_phone'),
    linkedinUrl: text('linkedin_url'),
    twitterUrl: text('twitter_url'),
    foundedYear: text('founded_year'),
    specialties: text('specialties').array().$defaultFn(() => []),
    benefits: jsonb('benefits').$defaultFn(() => []), // Array of benefit strings
    culture: text('culture'), // Description of company culture
    techStack: text('tech_stack').array().$defaultFn(() => []),
    officeLocations: jsonb('office_locations').$defaultFn(() => []), // Array of {city, country, address}
    verified: boolean('verified').$defaultFn(() => false).notNull(),
    status: text('status').$defaultFn(() => 'pending').notNull(), // pending | approved | rejected | banned
    adminNote: text('admin_note'),
    analytics: jsonb('analytics').$defaultFn(() => ({ profileViews: 0, jobPosts: 0, applications: 0 })),
    createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
    updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => ({
    statusCreatedAtIdx: index('idx_companies_status_created_at').on(table.status, table.createdAt.desc())
}));

export const companyRelations = relations(companies, ({ one }) => ({
    user: one(user, {
        fields: [companies.userId],
        references: [user.id]
    })
}));

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

export const schema = { user, session, account, verification, students, studentRelations, companies, companyRelations };
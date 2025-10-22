export interface QueryTemplateDefinition {
  id: string;
  role: "student" | "company" | "admin";
  category: string;
  name: string;
  description: string;
  prompt: string;
  chartType: "bar" | "line" | "pie" | "radar" | "table" | "metric" | "funnel";
  sortOrder: number;
}

export const STUDENT_TEMPLATES: QueryTemplateDefinition[] = [
  {
    id: "student-cgpa-compare",
    role: "student",
    category: "Profile Analysis",
    name: "How does my CGPA compare?",
    description: "See where your CGPA ranks among all students",
    prompt: "Calculate my CGPA percentile ranking among all students. Show total students, my CGPA, average CGPA, and my percentile rank.",
    chartType: "metric",
    sortOrder: 1
  },
  {
    id: "student-skills-demand",
    role: "student",
    category: "Market Insights",
    name: "Most in-demand skills",
    description: "Skills most frequently required in job postings",
    prompt: "Analyze all active jobs and show the top 10 most frequently required skills with their count.",
    chartType: "bar",
    sortOrder: 2
  },
  {
    id: "student-application-success",
    role: "student",
    category: "Application Stats",
    name: "My application success rate",
    description: "Breakdown of your application statuses",
    prompt: "Show distribution of my application statuses (pending, oa, interview, selected, rejected) with counts and percentages.",
    chartType: "pie",
    sortOrder: 3
  },
  {
    id: "student-profile-strength",
    role: "student",
    category: "Profile Analysis",
    name: "My profile strength analysis",
    description: "Multi-dimensional view of your profile competitiveness",
    prompt: "Compare my profile across multiple dimensions: CGPA percentile, number of skills vs average, number of certifications vs average, years of experience vs average, and number of applications. Return scores from 0-100 for each dimension.",
    chartType: "radar",
    sortOrder: 4
  },
  {
    id: "student-job-matches",
    role: "student",
    category: "Job Recommendations",
    name: "Best job matches for me",
    description: "Jobs that match your profile and eligibility",
    prompt: "Find active jobs I'm eligible for based on my CGPA, degree, and course. Calculate match score based on my skills overlap with job requirements. Show top 10 matches with company name, job title, salary, and match percentage.",
    chartType: "table",
    sortOrder: 5
  },
  {
    id: "student-application-trends",
    role: "student",
    category: "Application Stats",
    name: "My application timeline",
    description: "Track when you applied to jobs over time",
    prompt: "Show my applications over time, grouped by week for the last 2 months. Include total applications per week.",
    chartType: "line",
    sortOrder: 6
  }
];

export const COMPANY_TEMPLATES: QueryTemplateDefinition[] = [
  {
    id: "company-application-stats",
    role: "company",
    category: "Hiring Analytics",
    name: "Application statistics overview",
    description: "Overall stats for all your job postings",
    prompt: "Summarize application statistics across all my jobs: total jobs posted, total applications, average applications per job, applications by status (pending/oa/interview/selected/rejected), and average CGPA of applicants.",
    chartType: "metric",
    sortOrder: 1
  },
  {
    id: "company-cgpa-distribution",
    role: "company",
    category: "Applicant Insights",
    name: "Applicant CGPA distribution",
    description: "Distribution of applicant CGPAs across your jobs",
    prompt: "Show CGPA distribution of all applicants to my jobs. Group by CGPA ranges: <6.0, 6.0-7.0, 7.0-8.0, 8.0-9.0, >9.0 with counts.",
    chartType: "bar",
    sortOrder: 2
  },
  {
    id: "company-top-skills",
    role: "company",
    category: "Applicant Insights",
    name: "Top skills in applicant pool",
    description: "Most common skills among your applicants",
    prompt: "Analyze skills of all students who applied to my jobs. Show top 10 most common skills with frequency count.",
    chartType: "bar",
    sortOrder: 3
  },
  {
    id: "company-conversion-funnel",
    role: "company",
    category: "Hiring Analytics",
    name: "Hiring funnel analysis",
    description: "Application to selection conversion rates",
    prompt: "Create hiring funnel showing: total applications, candidates who passed to OA, candidates who passed to interview, and candidates selected. Show counts and conversion percentages at each stage.",
    chartType: "funnel",
    sortOrder: 4
  },
  {
    id: "company-job-performance",
    role: "company",
    category: "Hiring Analytics",
    name: "Job posting performance",
    description: "Compare performance across your job postings",
    prompt: "For each of my jobs, show: job title, total views (from analytics), total applications, conversion rate (applications/views), average applicant CGPA. Sort by applications descending.",
    chartType: "table",
    sortOrder: 5
  },
  {
    id: "company-course-breakdown",
    role: "company",
    category: "Applicant Insights",
    name: "Applicants by course",
    description: "Distribution of applicants across different courses",
    prompt: "Show distribution of applicants by their course (CSE, ECE, EEE, AIML, etc.). Include count and percentage for each course.",
    chartType: "pie",
    sortOrder: 6
  }
];

export const ADMIN_TEMPLATES: QueryTemplateDefinition[] = [
  {
    id: "admin-platform-overview",
    role: "admin",
    category: "Platform Stats",
    name: "Platform overview",
    description: "High-level statistics across the entire platform",
    prompt: "Provide comprehensive platform statistics: total users (by role), total students, total companies, total jobs (active/inactive), total applications, overall application success rate, average applications per job, and average jobs per company.",
    chartType: "metric",
    sortOrder: 1
  },
  {
    id: "admin-registration-trends",
    role: "admin",
    category: "Growth Analytics",
    name: "Registration trends",
    description: "Student vs company registration over time",
    prompt: "Show registration trends for students and companies over the last 3 months. Group by week and show separate counts for students and companies.",
    chartType: "line",
    sortOrder: 2
  },
  {
    id: "admin-job-trends",
    role: "admin",
    category: "Platform Stats",
    name: "Job posting activity",
    description: "Job posting trends over time",
    prompt: "Show job posting activity over the last 3 months. Group by week and show count of new jobs posted each week.",
    chartType: "line",
    sortOrder: 3
  },
  {
    id: "admin-success-by-course",
    role: "admin",
    category: "Placement Analytics",
    name: "Success rates by course",
    description: "Application selection rates for each course",
    prompt: "Calculate application success rate (selected/total applications) for each course (CSE, ECE, EEE, AIML). Show course, total applications, selections, and success rate percentage.",
    chartType: "bar",
    sortOrder: 4
  },
  {
    id: "admin-active-companies",
    role: "admin",
    category: "Platform Stats",
    name: "Most active companies",
    description: "Companies ranked by hiring activity",
    prompt: "Rank companies by total jobs posted and total applications received. Show top 10 companies with: company name, total jobs, total applications, average applications per job, and total selections made.",
    chartType: "table",
    sortOrder: 5
  },
  {
    id: "admin-cgpa-vs-success",
    role: "admin",
    category: "Placement Analytics",
    name: "CGPA vs selection rate",
    description: "Correlation between CGPA and getting selected",
    prompt: "Analyze selection rates by CGPA ranges. Group students into CGPA buckets: <6.0, 6.0-7.0, 7.0-8.0, 8.0-9.0, >9.0. For each bucket show: total applications, total selections, and success rate percentage.",
    chartType: "bar",
    sortOrder: 6
  },
  {
    id: "admin-application-status-dist",
    role: "admin",
    category: "Platform Stats",
    name: "Overall application status distribution",
    description: "Platform-wide application status breakdown",
    prompt: "Show distribution of all applications across statuses: pending, oa, interview, selected, rejected. Include counts and percentages.",
    chartType: "pie",
    sortOrder: 7
  },
  {
    id: "admin-salary-insights",
    role: "admin",
    category: "Salary Analytics",
    name: "Salary distribution analysis",
    description: "Salary offerings across all jobs",
    prompt: "Analyze salary offerings across all jobs. Show distribution by salary ranges (in INR): <3L, 3-5L, 5-7L, 7-10L, 10-15L, >15L. Include job count for each range and calculate average salary overall.",
    chartType: "bar",
    sortOrder: 8
  }
];

export const ALL_TEMPLATES: QueryTemplateDefinition[] = [
  ...STUDENT_TEMPLATES,
  ...COMPANY_TEMPLATES,
  ...ADMIN_TEMPLATES
];

export function getTemplatesByRole(role: "student" | "company" | "admin"): QueryTemplateDefinition[] {
  return ALL_TEMPLATES.filter(t => t.role === role).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getTemplateById(id: string): QueryTemplateDefinition | undefined {
  return ALL_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(role: "student" | "company" | "admin", category: string): QueryTemplateDefinition[] {
  return ALL_TEMPLATES
    .filter(t => t.role === role && t.category === category)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCategories(role: "student" | "company" | "admin"): string[] {
  const templates = getTemplatesByRole(role);
  return Array.from(new Set(templates.map(t => t.category)));
}


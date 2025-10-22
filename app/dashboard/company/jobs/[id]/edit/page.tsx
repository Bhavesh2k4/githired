"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "full-time",
    location: "",
    cgpaCutoff: "",
    eligibleCourses: [] as string[],
    eligibleDegrees: [] as string[],
    salary: "",
    skills: [] as string[],
    benefits: [] as string[],
  });

  useEffect(() => {
    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  const loadJob = async () => {
    try {
      const res = await fetch(`/api/company/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        const job = data.job;
        setFormData({
          title: job.title || "",
          description: job.description || "",
          type: job.type || "full-time",
          location: job.location || "",
          cgpaCutoff: job.cgpaCutoff || "",
          eligibleCourses: job.eligibleCourses || [],
          eligibleDegrees: job.eligibleDegrees || [],
          salary: job.salary || "",
          skills: job.skills || [],
          benefits: job.benefits || [],
        });
      } else {
        toast.error("Failed to load job");
      }
    } catch (error) {
      toast.error("Error loading job");
    } finally {
      setLoading(false);
    }
  };

  const handleCourseToggle = (course: string) => {
    if (formData.eligibleCourses.includes(course)) {
      setFormData({
        ...formData,
        eligibleCourses: formData.eligibleCourses.filter((c) => c !== course),
      });
    } else {
      setFormData({
        ...formData,
        eligibleCourses: [...formData.eligibleCourses, course],
      });
    }
  };

  const handleDegreeToggle = (degree: string) => {
    if (formData.eligibleDegrees.includes(degree)) {
      setFormData({
        ...formData,
        eligibleDegrees: formData.eligibleDegrees.filter((d) => d !== degree),
      });
    } else {
      setFormData({
        ...formData,
        eligibleDegrees: [...formData.eligibleDegrees, degree],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/company/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Job updated successfully");
        router.push(`/dashboard/company/jobs/${jobId}`);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update job");
      }
    } catch (error) {
      toast.error("Error updating job");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/company/jobs/${jobId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Job</h1>
          <p className="text-muted-foreground">Update job posting details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Job Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Job Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="internship">Internship</option>
                  <option value="full-time">Full-Time</option>
                </select>
              </div>

              <div>
                <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="salary">Salary/Stipend</Label>
              <Input
                id="salary"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eligibility Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cgpaCutoff">Minimum CGPA</Label>
              <Input
                id="cgpaCutoff"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={formData.cgpaCutoff}
                onChange={(e) => setFormData({ ...formData, cgpaCutoff: e.target.value })}
              />
            </div>

            <div>
              <Label>Eligible Courses</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["CSE", "ECE", "EEE", "AIML"].map((course) => (
                  <button
                    key={course}
                    type="button"
                    onClick={() => handleCourseToggle(course)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      formData.eligibleCourses.includes(course)
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-accent"
                    }`}
                  >
                    {course}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Eligible Degrees</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["BTech", "MTech", "MCA"].map((degree) => (
                  <button
                    key={degree}
                    type="button"
                    onClick={() => handleDegreeToggle(degree)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      formData.eligibleDegrees.includes(degree)
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-accent"
                    }`}
                  >
                    {degree}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href={`/dashboard/company/jobs/${jobId}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Update Job
          </Button>
        </div>
      </form>
    </div>
  );
}


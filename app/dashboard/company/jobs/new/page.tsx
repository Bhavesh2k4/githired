"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Heading2 } from "lucide-react";

export default function NewJobPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "full-time",
    location: "",
    cgpaCutoff: "",
    eligibleCourses: [] as string[],
    eligibleDegrees: [] as string[],
    jdUrl: "",
    salary: "",
    skills: [] as string[],
    benefits: [] as string[],
  });
  const [skillInput, setSkillInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");

  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Describe the role in detail..." }],
        },
      ],
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4",
      },
    },
  });

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

  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const removeSkill = (index: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index),
    });
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, benefitInput.trim()],
      });
      setBenefitInput("");
    }
  };

  const removeBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index),
    });
  };

  const handleJdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("pdf")) {
      toast.error("Only PDF files are allowed");
      return;
    }

    setUploading(true);
    try {
      // Get presigned URL (reusing student resume endpoint pattern)
      const res = await fetch("/api/student/resume/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl } = await res.json();

      // Upload file
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const publicUrl = uploadUrl.split("?")[0];
      setFormData({ ...formData, jdUrl: publicUrl });
      toast.success("JD uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload JD");
      console.error(error);
    } finally {
      setUploading(false);
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
      const aboutRole = editor?.getJSON();

      const res = await fetch("/api/company/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          aboutRole,
        }),
      });

      if (res.ok) {
        toast.success("Job posted successfully! Notifying eligible students...");
        router.push("/dashboard/company/jobs");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to post job");
      }
    } catch (error) {
      toast.error("Error posting job");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/company/jobs">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Post a New Job</h1>
          <p className="text-muted-foreground">Fill in the details to create a job posting</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential details about the job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">
                Job Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Software Engineer Intern"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">
                Short Description <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief overview of the role (200-300 characters)"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">
                  Job Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="internship">Internship</option>
                  <option value="full-time">Full-Time</option>
                </select>
              </div>

              <div>
                <Label htmlFor="location">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Bangalore, India"
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
                placeholder="e.g., 5-7 LPA or 20k/month"
              />
            </div>
          </CardContent>
        </Card>

        {/* Eligibility Criteria */}
        <Card>
          <CardHeader>
            <CardTitle>Eligibility Criteria</CardTitle>
            <CardDescription>Define who can apply for this job</CardDescription>
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
                placeholder="e.g., 7.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank for no CGPA requirement
              </p>
            </div>

            <div>
              <Label>Eligible Courses</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["CSE", "ECE", "EEE", "AIML"].map((course) => (
                  <button
                    key={course}
                    type="button"
                    onClick={() => handleCourseToggle(course)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      formData.eligibleCourses.includes(course)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-input hover:bg-accent"
                    }`}
                  >
                    {course}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to allow all courses
              </p>
            </div>

            <div>
              <Label>Eligible Degrees</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["BTech", "MTech", "MCA"].map((degree) => (
                  <button
                    key={degree}
                    type="button"
                    onClick={() => handleDegreeToggle(degree)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      formData.eligibleDegrees.includes(degree)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-input hover:bg-accent"
                    }`}
                  >
                    {degree}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to allow all degrees
              </p>
            </div>
          </CardContent>
        </Card>

        {/* About the Role */}
        <Card>
          <CardHeader>
            <CardTitle>About the Role</CardTitle>
            <CardDescription>Detailed description of responsibilities and requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={editor?.isActive("bold") ? "bg-accent" : ""}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={editor?.isActive("italic") ? "bg-accent" : ""}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={editor?.isActive("heading", { level: 2 }) ? "bg-accent" : ""}
                >
                  <Heading2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={editor?.isActive("bulletList") ? "bg-accent" : ""}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={editor?.isActive("orderedList") ? "bg-accent" : ""}
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </div>
              <EditorContent editor={editor} />
            </div>
          </CardContent>
        </Card>

        {/* Job Description Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Job Description (PDF)</CardTitle>
            <CardDescription>Upload a detailed JD document (optional)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="jd-upload">Upload JD (PDF)</Label>
              <Input
                id="jd-upload"
                type="file"
                accept=".pdf"
                onChange={handleJdUpload}
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
              {formData.jdUrl && (
                <p className="text-sm text-green-600">✓ JD uploaded successfully</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Required Skills</CardTitle>
            <CardDescription>Add skills required for this role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="e.g., React, Node.js, Python"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              />
              <Button type="button" onClick={addSkill} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Benefits</CardTitle>
            <CardDescription>Perks and benefits of this role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                placeholder="e.g., Health Insurance, Work from Home"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())}
              />
              <Button type="button" onClick={addBenefit} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.benefits.map((benefit, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm flex items-center gap-2"
                >
                  {benefit}
                  <button
                    type="button"
                    onClick={() => removeBenefit(index)}
                    className="hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/company/jobs">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Post Job
          </Button>
        </div>
      </form>
    </div>
  );
}


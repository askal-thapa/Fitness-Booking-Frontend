"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { onboardingApi } from "@/lib/api";

const STEPS = [
  "Goal",
  "Metrics",
  "Activity",
  "Experience",
  "Health",
  "Preferences",
];

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState({
    goal: "",
    age: "",
    height: "",
    weight: "",
    activityLevel: "",
    experienceLevel: "",
    healthConditions: {
      painAreas: [] as string[],
      conditions: [] as string[],
      notes: "",
    },
    workoutType: "",
    dietPreference: "",
  });

  const nextStep = () => {
    if (step < STEPS.length) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const finishOnboarding = async () => {
    setLoading(true);
    setError("");
    try {
      if (!session?.user) throw new Error("User not found in session");
      const user = session.user as any;

      await onboardingApi.save({
        goal: formData.goal,
        age: parseInt(formData.age as string),
        height: parseInt(formData.height as string),
        weight: parseInt(formData.weight as string),
        activityLevel: formData.activityLevel,
        experienceLevel: formData.experienceLevel,
        healthConditions: formData.healthConditions,
        workoutType: formData.workoutType,
        dietPreference: formData.dietPreference,
      }, user.accessToken);

      await update({
        onboardingCompleted: true
      });

      setLoading(false);
      router.push("/dashboard");
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to save onboarding data");
    }
  };

  const togglePainArea = (area: string) => {
    setFormData((prev) => {
      const current = prev.healthConditions.painAreas;
      return {
        ...prev,
        healthConditions: {
          ...prev.healthConditions,
          painAreas: current.includes(area)
            ? current.filter((a) => a !== area)
            : [...current, area],
        },
      };
    });
  };

  const toggleCondition = (cond: string) => {
    setFormData((prev) => {
      const current = prev.healthConditions.conditions;
      let next: string[];
      if (cond === "None") {
        next = current.includes("None") ? [] : ["None"];
      } else {
        const withoutNone = current.filter((c) => c !== "None");
        next = withoutNone.includes(cond)
          ? withoutNone.filter((c) => c !== cond)
          : [...withoutNone, cond];
      }
      return {
        ...prev,
        healthConditions: { ...prev.healthConditions, conditions: next },
      };
    });
  };

  const progress = (step / STEPS.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-warm-dark">Creating your personalized fitness plan...</h2>
          <p className="text-warm-gray">Analyzing your metrics and preferences</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center py-12 px-4 md:py-20">
      <div className="max-w-xl w-full space-y-10">
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Step {step} of {STEPS.length}</span>
              <h1 className="text-3xl font-bold text-warm-dark">{STEPS[step - 1]}</h1>
            </div>
            <span className="text-sm font-medium text-warm-gray">{Math.round(progress)}% Complete</span>
          </div>
          <ProgressBar progress={progress} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="min-h-[400px]">
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {["Lose Weight", "Build Muscle", "Stay Fit", "Improve Health"].map((goal) => (
                <Card
                  key={goal}
                  selected={formData.goal === goal}
                  onClick={() => setFormData({ ...formData, goal })}
                  className="flex items-center justify-center p-8"
                >
                  <span className="text-lg font-semibold">{goal}</span>
                </Card>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <Input
                label="Age"
                type="number"
                placeholder="25"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
              <Input
                label="Height (cm)"
                type="number"
                placeholder="180"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              />
              <Input
                label="Weight (kg)"
                type="number"
                placeholder="75"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {[
                { value: "sedentary", label: "Sedentary", desc: "Little to no exercise" },
                { value: "light", label: "Lightly Active", desc: "Light exercise 1-3 days/week" },
                { value: "moderate", label: "Moderately Active", desc: "Moderate exercise 3-5 days/week" },
                { value: "active", label: "Active", desc: "Hard exercise 6-7 days/week" },
                { value: "very_active", label: "Very Active", desc: "Intense exercise & physical job" },
              ].map((level) => (
                <Card
                  key={level.value}
                  selected={formData.activityLevel === level.value}
                  onClick={() => setFormData({ ...formData, activityLevel: level.value })}
                  className="p-5 flex justify-between items-center"
                >
                  <div>
                    <span className="font-semibold">{level.label}</span>
                    <p className="text-xs text-warm-gray mt-0.5">{level.desc}</p>
                  </div>
                  {formData.activityLevel === level.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </Card>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 gap-4">
              {[
                { value: "beginner", label: "Beginner", desc: "New to fitness training" },
                { value: "intermediate", label: "Intermediate", desc: "Some experience with workouts" },
                { value: "advanced", label: "Advanced", desc: "Experienced and consistent" },
              ].map((exp) => (
                <Card
                  key={exp.value}
                  selected={formData.experienceLevel === exp.value}
                  onClick={() => setFormData({ ...formData, experienceLevel: exp.value })}
                  className="p-6 text-center"
                >
                  <span className="text-xl font-bold">{exp.label}</span>
                  <p className="text-xs text-warm-gray mt-1">{exp.desc}</p>
                </Card>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8">
              {/* Pain areas */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-warm-dark">Where do you feel pain or discomfort?</p>
                  <p className="text-xs text-warm-gray mt-0.5">Select all that apply — you can pick multiple</p>
                </div>

                <div className="space-y-3">
                  {/* Upper body */}
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Upper Body</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Neck", "Left Shoulder", "Right Shoulder",
                      "Left Elbow", "Right Elbow", "Left Wrist", "Right Wrist",
                      "Chest", "Upper Back",
                    ].map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => togglePainArea(area)}
                        className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
                          formData.healthConditions.painAreas.includes(area)
                            ? "bg-accent/15 border-accent text-accent-light font-semibold"
                            : "bg-white border-cream-darker text-warm-gray hover:border-primary/30"
                        }`}
                      >
                        {formData.healthConditions.painAreas.includes(area) ? "✓ " : ""}{area}
                      </button>
                    ))}
                  </div>

                  {/* Core / Lower body */}
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wider pt-1">Core & Lower Body</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Lower Back", "Left Hip", "Right Hip",
                      "Left Knee", "Right Knee", "Left Ankle", "Right Ankle",
                    ].map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => togglePainArea(area)}
                        className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
                          formData.healthConditions.painAreas.includes(area)
                            ? "bg-accent/15 border-accent text-accent-light font-semibold"
                            : "bg-white border-cream-darker text-warm-gray hover:border-primary/30"
                        }`}
                      >
                        {formData.healthConditions.painAreas.includes(area) ? "✓ " : ""}{area}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.healthConditions.painAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-3 bg-accent/5 rounded-xl border border-accent/20">
                    <span className="text-xs text-warm-gray font-medium mr-1">Selected:</span>
                    {formData.healthConditions.painAreas.map((a) => (
                      <span key={a} className="text-xs bg-accent/15 text-accent-light font-semibold px-2 py-0.5 rounded-lg">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-cream-darker" />

              {/* Other conditions */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-warm-dark">Any other health conditions?</p>
                  <p className="text-xs text-warm-gray mt-0.5">Helps us match you with the right trainer</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Heart condition", "Diabetes", "Hypertension", "Asthma", "Osteoporosis", "None"].map((cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => toggleCondition(cond)}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        formData.healthConditions.conditions.includes(cond)
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-cream-darker text-warm-gray hover:border-primary/30"
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-cream-darker" />

              {/* Free text */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-warm-dark">
                  Additional details <span className="text-warm-gray font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.healthConditions.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      healthConditions: { ...prev.healthConditions, notes: e.target.value },
                    }))
                  }
                  rows={3}
                  placeholder="e.g. Had knee surgery in 2022, chronic lower back pain for 2 years, mild sciatica…"
                  className="w-full bg-cream border border-cream-darker text-warm-dark text-sm rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-warm-gray/50 resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-sm font-medium text-warm-gray">Workout Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {["Gym", "Home", "Yoga"].map((t) => (
                    <Card
                      key={t}
                      selected={formData.workoutType === t}
                      onClick={() => setFormData({ ...formData, workoutType: t })}
                      className="p-4 text-center"
                    >
                      <span className="text-sm font-bold">{t}</span>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-medium text-warm-gray">Diet Preference</label>
                <div className="grid grid-cols-3 gap-3">
                  {["Veg", "Non-veg", "Vegan"].map((d) => (
                    <Card
                      key={d}
                      selected={formData.dietPreference === d}
                      onClick={() => setFormData({ ...formData, dietPreference: d })}
                      className="p-4 text-center"
                    >
                      <span className="text-sm font-bold">{d}</span>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-8">
          {step > 1 && (
            <Button variant="secondary" onClick={prevStep} className="flex-1">
              Back
            </Button>
          )}
          <Button
            onClick={nextStep}
            className="flex-[2]"
            disabled={
                (step === 1 && !formData.goal) ||
                (step === 2 && (!formData.age || !formData.height || !formData.weight)) ||
                (step === 3 && !formData.activityLevel) ||
                (step === 4 && !formData.experienceLevel) ||
                (step === 6 && (!formData.workoutType || !formData.dietPreference))
            }
          >
            {step === STEPS.length ? "Finish Setup" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}

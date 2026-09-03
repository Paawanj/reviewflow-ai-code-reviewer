import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const repositoryFormSchema = z.object({
  owner: z
    .string()
    .trim()
    .min(1, "Enter the GitHub owner or organization.")
    .max(39, "Owner must be 39 characters or fewer.")
    .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, and hyphens only."),
  repo: z
    .string()
    .trim()
    .min(1, "Enter the repository name.")
    .max(100, "Repository name must be 100 characters or fewer.")
    .regex(/^[A-Za-z0-9._-]+$/, "Use letters, numbers, dots, hyphens, or underscores only."),
});

export default function RepositoryPickerForm({ initialOwner = "", initialRepo = "", isLoading, onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(repositoryFormSchema),
    defaultValues: { owner: initialOwner, repo: initialRepo },
    mode: "onTouched",
  });

  return (
    <form className="app-panel mb-7 grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:p-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <Input
          {...register("owner")}
          aria-invalid={Boolean(errors.owner)}
          placeholder="Owner, for example octocat"
        />
        {errors.owner && <p className="mt-1 text-xs text-red-600">{errors.owner.message}</p>}
      </div>

      <div>
        <Input
          {...register("repo")}
          aria-invalid={Boolean(errors.repo)}
          placeholder="Repository, for example Hello-World"
        />
        {errors.repo && <p className="mt-1 text-xs text-red-600">{errors.repo.message}</p>}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Loading..." : "Load PRs"}
      </Button>
    </form>
  );
}

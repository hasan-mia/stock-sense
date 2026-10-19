import { RegisterForm } from "@/features/auth/components/register-form";
import { LoginBrandPanel } from "@/features/auth/components/login-form";

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f7f6] px-4 py-8 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-[-15rem] size-[36rem] rounded-full bg-emerald-200/35 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-56 -right-40 size-[40rem] rounded-full bg-teal-100/60 blur-3xl"
      />
      <div className="relative flex w-full max-w-[1000px] items-center justify-center gap-10 xl:gap-14">
        <LoginBrandPanel
          title="Get your inventory under control."
          description="Create a staff account to manage sales and monitor stock. Admin access is assigned by an administrator."
        />
        <RegisterForm />
      </div>
    </main>
  );
}

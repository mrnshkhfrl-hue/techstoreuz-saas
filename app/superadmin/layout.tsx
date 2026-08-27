import SuperAdminAuthWrapper from "@/components/SuperAdminAuthWrapper";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen bg-black text-white overflow-x-hidden">
      <SuperAdminAuthWrapper>
        {children}
      </SuperAdminAuthWrapper>
    </div>
  );
}

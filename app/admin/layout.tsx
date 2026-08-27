import AdminAuthWrapper from "@/components/AdminAuthWrapper";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen bg-black text-white overflow-x-hidden">
      <AdminAuthWrapper>
        {children}
      </AdminAuthWrapper>
    </div>
  );
}

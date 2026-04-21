import { AdminSidebar } from "@/components/AdminSidebar";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-paper md:flex-row">
      <AdminSidebar />
      <div className="min-h-[60vh] flex-1 border-secondary/40 bg-paper md:border-l">
        <div className="mx-auto max-w-3xl px-5 py-8 md:max-w-4xl md:px-10 md:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}

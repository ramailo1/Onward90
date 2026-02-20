import Providers from "@/components/Providers";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Providers>
            <div className="dashboard-layout">
                <Sidebar />
                <div className="main-content">{children}</div>
            </div>
        </Providers>
    );
}

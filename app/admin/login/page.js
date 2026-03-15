import AdminLoginForm from "../../../components/admin/AdminLoginForm";

export const metadata = {
  title: "Admin Login | 13log",
};

export default function AdminLoginPage() {
  return (
    <section className="admin-login-page">
      <header className="page-header">
        <h1>Admin Login</h1>
      </header>
      <AdminLoginForm />
    </section>
  );
}

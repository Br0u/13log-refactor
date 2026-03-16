import AdminLoginForm from "../../../components/admin/AdminLoginForm";

export const metadata = {
  title: "Admin Login | 13log",
};

export default function AdminLoginPage() {
  return (
    <section className="admin-login-page admin-login-shell admin-shell--latin">
      <div className="admin-login-shell__panel">
        <header className="admin-page-header admin-login-shell__header">
          <div>
            <p className="admin-eyebrow">Admin Access</p>
            <h1>Sign In</h1>
          </div>
        </header>
        <AdminLoginForm />
      </div>
    </section>
  );
}

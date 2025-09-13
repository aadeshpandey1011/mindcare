export default function Unauthorized() {
  return (
    <div className="h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold text-red-600">
        ❌ Access Denied — Admins only
      </h1>
    </div>
  );
}

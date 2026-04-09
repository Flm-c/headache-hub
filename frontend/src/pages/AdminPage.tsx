export default function AdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <p className="text-red-800">Access denied. Admin privileges required.</p>
      </div>
    </div>
  );
}

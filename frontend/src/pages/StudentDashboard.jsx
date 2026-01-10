import { useAuth } from '../context/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Student Dashboard</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600 mb-2">Welcome, {user?.name}!</p>
        <p className="text-sm text-gray-500">Email: {user?.email}</p>
        <p className="text-sm text-gray-500">Role: {user?.role}</p>
      </div>
    </div>
  );
};

export default StudentDashboard;

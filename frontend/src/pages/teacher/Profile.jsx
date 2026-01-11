import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function TeacherProfile() {
  const { user } = useAuth();
  
  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-3xl font-bold text-slate-900 mb-6">My Profile</h2>
      
      <Card className="mb-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <p className="text-slate-900">{user?.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <p className="text-slate-900">{user?.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <span className="inline-block px-3 py-1 text-sm font-medium bg-indigo-100 text-indigo-800 rounded">
                Teacher
              </span>
            </div>
          </div>
        </div>
      </Card>
      
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Settings</h3>
          <p className="text-slate-600 mb-4">Profile settings coming soon</p>
          <Button variant="outline">Edit Profile</Button>
        </div>
      </Card>
    </div>
  );
}

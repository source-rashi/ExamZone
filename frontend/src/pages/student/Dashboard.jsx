import Card from '../../components/ui/Card';

export default function StudentDashboard() {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-slate-900 mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Enrolled Classes</h3>
            <p className="text-4xl font-bold text-slate-900">0</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Pending Exams</h3>
            <p className="text-4xl font-bold text-slate-900">0</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Completed Exams</h3>
            <p className="text-4xl font-bold text-slate-900">0</p>
          </div>
        </Card>
      </div>
      
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Exams</h3>
          <p className="text-slate-600">No upcoming exams</p>
        </div>
      </Card>
    </div>
  );
}

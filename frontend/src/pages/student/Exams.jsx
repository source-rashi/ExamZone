import Card from '../../components/ui/Card';

export default function StudentExams() {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-slate-900 mb-6">My Exams</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Pending Exams</h3>
          <Card>
            <div className="p-6 text-center">
              <p className="text-slate-600">No pending exams</p>
            </div>
          </Card>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Completed Exams</h3>
          <Card>
            <div className="p-6 text-center">
              <p className="text-slate-600">No completed exams</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

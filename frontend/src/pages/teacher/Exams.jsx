import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function TeacherExams() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-slate-900">My Exams</h2>
        <Button variant="primary">Create Exam</Button>
      </div>
      
      <Card>
        <div className="p-6 text-center">
          <p className="text-slate-600 mb-4">You haven't created any exams yet</p>
          <Button variant="primary">Create Your First Exam</Button>
        </div>
      </Card>
    </div>
  );
}

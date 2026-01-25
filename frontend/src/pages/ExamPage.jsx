
import { useState } from 'react';
import Button from '../components/ui/Button';
import { studentAPI } from '../api/student.api';

const ExamPage = ({ examId, examTitle }) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setError('');
    setDownloading(true);
    try {
      const blob = await studentAPI.downloadMyPaper(examId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${examTitle || 'My_Exam_Paper'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download paper');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4">Exam Page</h1>
        <p className="text-gray-600 mb-6">Exam interface placeholder</p>
        <Button onClick={handleDownload} disabled={downloading}>
          {downloading ? 'Downloading...' : 'Download My Paper'}
        </Button>
        {error && <div className="mt-4 text-red-600">{error}</div>}
      </div>
    </div>
  );
};

export default ExamPage;

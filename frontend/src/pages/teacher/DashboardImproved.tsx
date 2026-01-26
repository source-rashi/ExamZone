/**
 * PHASE 9.2 - Improved Teacher Dashboard
 * Professional academic portal with enhanced UX
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-expect-error - AuthContext is a legacy JSX file without TypeScript declarations
import { useAuth } from '../../context/AuthContext';
import { 
  StatsCard, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Button, 
  EmptyState, 
  EmptyStateIcons,
  LoadingSpinner,
  Alert
} from '../../components/ui';
// @ts-expect-error - class.api is a legacy JS file without TypeScript declarations
import classAPI from '../../api/class.api';
import { 
  BookOpen, 
  FileText, 
  Users, 
  Plus, 
  ChevronRight,
} from 'lucide-react';
import { theme } from '../../styles/theme';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await classAPI.getTeacherClasses();
      setClasses(data.classes || []);
    } catch (err) {
      console.error('Load classes error:', err instanceof Error ? err.message : 'Unknown error');
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0);
  const totalExams = classes.reduce((sum, cls) => sum + (cls.exams?.length || 0), 0);
  const recentClasses = classes.slice(0, 4);

  return (
    <div style={{
      padding: theme.spacing[8],
      maxWidth: '1400px',
      margin: '0 auto',
    }}>
      {/* Welcome Header */}
      <div style={{ marginBottom: theme.spacing[8] }}>
        <h1 style={{
          fontSize: theme.typography.fontSize['4xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[2],
        }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{
          fontSize: theme.typography.fontSize.lg,
          color: theme.colors.text.secondary,
        }}>
          Here's an overview of your classes and activities
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ marginBottom: theme.spacing[6] }}>
          <Alert variant="danger" onClose={() => setError('')}>
            {error}
          </Alert>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: theme.spacing[6],
        marginBottom: theme.spacing[8],
      }}>
        <StatsCard
          label="Total Classes"
          value={classes.length}
          icon={<BookOpen size={28} />}
          iconColor={theme.colors.primary[600]}
          loading={loading}
        />
        
        <StatsCard
          label="Total Students"
          value={totalStudents}
          icon={<Users size={28} />}
          iconColor={theme.colors.success[600]}
          loading={loading}
        />
        
        <StatsCard
          label="Total Exams"
          value={totalExams}
          icon={<FileText size={28} />}
          iconColor={theme.colors.warning[600]}
          loading={loading}
          subtext="Across all classes"
        />
      </div>

      {/* Recent Classes Section */}
      <Card variant="elevated" padding={0}>
        <CardHeader style={{
          padding: theme.spacing[6],
          paddingBottom: theme.spacing[4],
          marginBottom: 0,
          borderBottom: `1px solid ${theme.colors.border.light}`,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <CardTitle>Your Classes</CardTitle>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => navigate('/teacher/classes')}
            >
              Create Class
            </Button>
          </div>
        </CardHeader>

        <CardContent style={{ padding: theme.spacing[6] }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: theme.spacing[12],
            }}>
              <LoadingSpinner size="lg" />
            </div>
          ) : classes.length === 0 ? (
            <EmptyState
              icon={EmptyStateIcons.NoClasses}
              title="No classes yet"
              description="Create your first class to start managing exams and students."
              action={{
                label: 'Create Your First Class',
                onClick: () => navigate('/teacher/classes'),
              }}
            />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: theme.spacing[4],
            }}>
              {recentClasses.map((cls) => (
                <Card
                  key={cls._id}
                  variant="outlined"
                  padding={5}
                  hover
                  onClick={() => navigate(`/teacher/class/${cls._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: theme.spacing[3],
                    }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontSize: theme.typography.fontSize.lg,
                          fontWeight: theme.typography.fontWeight.semibold,
                          color: theme.colors.text.primary,
                          marginBottom: theme.spacing[1],
                        }}>
                          {cls.title || cls.name}
                        </h3>
                        {cls.subject && (
                          <p style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.text.secondary,
                          }}>
                            {cls.subject}
                          </p>
                        )}
                      </div>
                      <ChevronRight
                        size={20}
                        style={{ color: theme.colors.text.tertiary }}
                      />
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: theme.spacing[4],
                      paddingTop: theme.spacing[3],
                      borderTop: `1px solid ${theme.colors.border.light}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                        <Users size={16} style={{ color: theme.colors.text.secondary }} />
                        <span style={{
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.text.secondary,
                        }}>
                          {cls.students?.length || 0} students
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                        <FileText size={16} style={{ color: theme.colors.text.secondary }} />
                        <span style={{
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.text.secondary,
                        }}>
                          {cls.exams?.length || 0} exams
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!loading && classes.length > 4 && (
            <div style={{
              marginTop: theme.spacing[6],
              textAlign: 'center',
            }}>
              <Button
                variant="outline"
                onClick={() => navigate('/teacher/classes')}
                icon={<ChevronRight size={16} />}
                iconPosition="right"
              >
                View All Classes ({classes.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div style={{
        marginTop: theme.spacing[8],
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: theme.spacing[4],
      }}>
        <Card
          variant="flat"
          padding={5}
          hover
          onClick={() => navigate('/teacher/classes')}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: theme.borderRadius.full,
              backgroundColor: theme.colors.primary[100],
              color: theme.colors.primary[600],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              marginBottom: theme.spacing[3],
            }}>
              <Plus size={24} />
            </div>
            <h4 style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
            }}>
              Create New Class
            </h4>
          </div>
        </Card>
      </div>
    </div>
  );
}

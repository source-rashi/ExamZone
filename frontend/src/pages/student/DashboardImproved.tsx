/**
 * PHASE 9.3 - Improved Student Dashboard
 * Using new design system components
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';
import { Card, Button, StatsCard, EmptyState, Loading, Badge } from '../../components/ui';
import classAPI from '../../api/class.api';
import { 
  BookOpen, 
  FileText, 
  CheckCircle, 
  Users, 
  Plus,
  ArrowRight,
  GraduationCap,
  Calendar,
  Target,
} from 'lucide-react';

export default function StudentDashboardImproved() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await classAPI.getStudentClasses();
      setClasses(data.classes || []);
    } catch (err) {
      console.error('[Dashboard] Load classes error:', err);
      setError(err.response?.data?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = classCode.trim();
    
    if (!trimmedCode) {
      alert('Please enter a class code');
      return;
    }

    if (trimmedCode.length !== 6) {
      alert('Class code must be exactly 6 characters');
      return;
    }

    try {
      setJoining(true);
      await classAPI.joinClass(trimmedCode);
      
      setClassCode('');
      setShowJoinModal(false);
      loadClasses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to join class');
    } finally {
      setJoining(false);
    }
  };

  const displayClasses = classes.slice(0, 4);

  if (loading) {
    return (
      <div style={{ padding: theme.spacing[8], maxWidth: '1400px', margin: '0 auto' }}>
        <Loading.Overlay message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div style={{ padding: theme.spacing[8], maxWidth: '1400px', margin: '0 auto' }}>
      {/* Welcome Header */}
      <div style={{ marginBottom: theme.spacing[8] }}>
        <h1 style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[2],
        }}>
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p style={{
          fontSize: theme.typography.fontSize.lg,
          color: theme.colors.text.secondary,
        }}>
          Track your enrolled classes, exams, and academic progress
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: theme.spacing[6],
        marginBottom: theme.spacing[8],
      }}>
        <StatsCard
          icon={<BookOpen size={24} />}
          label="Enrolled Classes"
          value={classes.length}
          variant="primary"
        />
        
        <StatsCard
          icon={<FileText size={24} />}
          label="Active Exams"
          value={0}
          subtitle="No active exams"
          variant="success"
        />
        
        <StatsCard
          icon={<CheckCircle size={24} />}
          label="Completed"
          value={0}
          subtitle="Exams completed"
          variant="warning"
        />

        <StatsCard
          icon={<Target size={24} />}
          label="Avg. Score"
          value="--"
          subtitle="No results yet"
          variant="neutral"
        />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: theme.spacing[8] }}>
        <h2 style={{
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[4],
        }}>
          Quick Actions
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: theme.spacing[4],
        }}>
          <Card
            variant="elevated"
            padding={6}
            hover
            onClick={() => setShowJoinModal(true)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[4] }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: theme.borderRadius.lg,
                backgroundColor: theme.colors.success[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Plus size={24} style={{ color: theme.colors.success[600] }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing[1],
                }}>
                  Join a Class
                </h3>
                <p style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                }}>
                  Enter 6-digit class code
                </p>
              </div>
            </div>
          </Card>

          <Link to="/student/exams" style={{ textDecoration: 'none' }}>
            <Card variant="elevated" padding={6} hover style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[4] }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: theme.borderRadius.lg,
                  backgroundColor: theme.colors.primary[50],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <GraduationCap size={24} style={{ color: theme.colors.primary[600] }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing[1],
                  }}>
                    View Exams
                  </h3>
                  <p style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                  }}>
                    Check upcoming exams
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* My Classes Section */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing[5],
        }}>
          <h2 style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
          }}>
            My Classes
          </h2>
          {classes.length > 4 && (
            <Link
              to="/student/classes"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing[2],
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.primary[600],
                textDecoration: 'none',
              }}
            >
              View all {classes.length} classes
              <ArrowRight size={16} />
            </Link>
          )}
        </div>

        {classes.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={48} />}
            title="No Classes Yet"
            description="Join your first class to get started with your academic journey"
            action={
              <Button
                variant="primary"
                onClick={() => setShowJoinModal(true)}
                icon={<Plus size={18} />}
              >
                Join a Class
              </Button>
            }
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: theme.spacing[5],
          }}>
            {displayClasses.map((classItem: any) => (
              <Card
                key={classItem._id}
                variant="elevated"
                padding={6}
                hover
                onClick={() => navigate(`/student/classes/${classItem._id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: theme.spacing[3],
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: theme.borderRadius.lg,
                      backgroundColor: theme.colors.primary[50],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <BookOpen size={20} style={{ color: theme.colors.primary[600] }} />
                    </div>
                    <Badge variant="primary" size="sm">
                      {classItem.studentCount || 0} students
                    </Badge>
                  </div>

                  <h3 style={{
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing[2],
                  }}>
                    {classItem.title || classItem.name}
                  </h3>

                  {classItem.description && (
                    <p style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary,
                      lineHeight: theme.typography.lineHeight.relaxed,
                      marginBottom: theme.spacing[3],
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {classItem.description}
                    </p>
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing[2],
                    paddingTop: theme.spacing[3],
                    borderTop: `1px solid ${theme.colors.border.light}`,
                  }}>
                    <Users size={14} style={{ color: theme.colors.text.tertiary }} />
                    <span style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.text.secondary,
                    }}>
                      {classItem.teacher?.name || 'Unknown Teacher'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: theme.zIndex.modal,
          padding: theme.spacing[4],
        }}>
          <Card
            variant="elevated"
            padding={6}
            style={{ width: '100%', maxWidth: '400px' }}
          >
            <form onSubmit={handleJoinClass}>
              <h2 style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[4],
              }}>
                Join a Class
              </h2>

              <div style={{ marginBottom: theme.spacing[5] }}>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing[2],
                }}>
                  Class Code
                </label>
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  style={{
                    width: '100%',
                    padding: theme.spacing[3],
                    fontSize: theme.typography.fontSize.base,
                    border: `1px solid ${theme.colors.border.DEFAULT}`,
                    borderRadius: theme.borderRadius.md,
                    outline: 'none',
                    transition: `border-color ${theme.transitions.fast}`,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = theme.colors.primary[500];
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.colors.border.DEFAULT;
                  }}
                  autoFocus
                />
                <p style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.tertiary,
                  marginTop: theme.spacing[2],
                }}>
                  Ask your teacher for the class code
                </p>
              </div>

              <div style={{ display: 'flex', gap: theme.spacing[3] }}>
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setShowJoinModal(false);
                    setClassCode('');
                  }}
                  disabled={joining}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={joining}
                  disabled={classCode.length !== 6}
                >
                  Join Class
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * TypeScript declaration file for student API
 * Provides type definitions for student-related API calls
 */

declare module './student.api' {
  export interface Exam {
    _id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    duration: number;
    class: any;
    [key: string]: any;
  }

  export interface StudentAPI {
    getExams(): Promise<{ exams: Exam[] }>;
    getExamById(id: string): Promise<any>;
    submitExam(id: string, data: any): Promise<any>;
    getResults(): Promise<any>;
    [key: string]: any;
  }

  export const studentAPI: StudentAPI;
}

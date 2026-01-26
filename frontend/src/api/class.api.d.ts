/**
 * TypeScript declaration file for class API
 * Provides type definitions for class-related API calls
 */

declare module './class.api' {
  export interface Class {
    _id: string;
    name: string;
    subject: string;
    teacher: any;
    students: any[];
    exams: any[];
    [key: string]: any;
  }

  export interface ClassAPI {
    getStudentClasses(): Promise<{ classes: Class[] }>;
    getTeacherClasses(): Promise<{ classes: Class[] }>;
    createClass(data: any): Promise<any>;
    updateClass(id: string, data: any): Promise<any>;
    deleteClass(id: string): Promise<any>;
    [key: string]: any;
  }

  const classAPI: ClassAPI;
  export default classAPI;
}

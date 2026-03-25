import { Course } from '../../types';

interface CourseGridProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  t: (key: string) => string;
}

export const CourseGrid = ({ courses, onSelectCourse, t }: CourseGridProps) => (
  <div className="animate-fade-in">
    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{t('welcome')}</h2>
    <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg">{t('continue_learning')}</p>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <button
          key={course.id}
          onClick={() => onSelectCourse(course)}
          className="group bg-white dark:bg-[#151518] p-6 rounded-3xl shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-slate-100 dark:border-slate-800 text-left"
        >
          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
            {course.icon}
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t(`course_${course.id}`) || course.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t(`desc_${course.id}`)}</p>
        </button>
      ))}
    </div>
  </div>
);

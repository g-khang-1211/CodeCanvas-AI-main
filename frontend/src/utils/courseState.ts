import { Course, Question, Unit } from '../types';

export const replaceCourseUnits = (
  courses: Course[],
  courseId: string,
  levelId: string,
  units: Unit[]
) => (
  courses.map((course) => {
    if (course.id !== courseId) return course;

    return {
      ...course,
      levels: course.levels.map((level) => (
        level.id !== levelId ? level : { ...level, units }
      )),
    };
  })
);

export const replaceUnitContent = (
  courses: Course[],
  courseId: string,
  levelId: string,
  unitId: string,
  content: string,
  questions: Question[]
) => (
  courses.map((course) => {
    if (course.id !== courseId) return course;

    return {
      ...course,
      levels: course.levels.map((level) => {
        if (level.id !== levelId) return level;

        return {
          ...level,
          units: level.units.map((unit) => (
            unit.id !== unitId ? unit : { ...unit, content, questions }
          )),
        };
      }),
    };
  })
);

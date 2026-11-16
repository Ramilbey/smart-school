import { NavProvider } from './lib/nav.tsx';
import { StoreProvider } from './lib/store.tsx';
import { TeacherDashboard } from './screens/teacher/TeacherDashboard.tsx';
import './styles/base.css';
import './styles/shell.css';
import './styles/academic.css';
import './styles/clarity.css';
import './styles/redesign.css';

/** The teacher's class view with the Smart Attendance demo (camera estimate + teacher confirmation), opened by ?go=teacher. */
export function TeacherApp() {
  return (
    <StoreProvider>
      <NavProvider initial={[{ name: 'teacher' }]}>
        <TeacherDashboard />
      </NavProvider>
    </StoreProvider>
  );
}

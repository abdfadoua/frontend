import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './component/login/login';
import SignUp from './component/signup/signup';
import ApprenantDashboard from './component/apprenant/apprenantDashboard';
import FormateurDashboard from './component/formateur/formateurDashboard';
import FormateurTrainingPage from './component/formateur/FormationFF.jsx';
import TrainingPage from './component/apprenant/Training';
import ResetPassword from './component/ResetPassword/ResetPassword..jsx';
import ForgotPassword from './component/ResetPassword/forgotPassword.jsx';
import Emargement from './component/apprenant/Emargement';
import ParticipantsEmargement from './component/formateur/participantEtEmargement';
import AdminDashboard from './component/Admin/AdminDashboard';
import ApprenantAdmin from './component/Admin/ApprenantAdmin';
import TrainerManagement from './component/Admin/formateurAdmin.jsx';
import History from './component/Admin/History';
import ValidationAcquis from './component/apprenant/Validation_acquis.jsx';
import FeedbackPage from './component/apprenant/Feedbacksapp.jsx';
import VerifyEmail from './component/VerifyEmail.jsx';
import RoleSelection from './component/roleSelection';
import ValidationFormateur from './component/formateur/ValidationFormateur.jsx';
import FormateurStatistique from './component/formateur/formateurStat.jsx';
import StatAdmin from './component/Admin/Statadmin.jsx';
import StatApprenant from './component/apprenant/statapprenant.jsx'; // Import new component
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PrivateRoute = ({ element, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/login" />;
  }

  return element;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        <Route
          path="/apprenant-dashboard"
          element={<PrivateRoute element={<ApprenantDashboard />} allowedRoles={['apprenant']} />}
        />
        <Route
          path="/formateur-dashboard"
          element={<PrivateRoute element={<FormateurDashboard />} allowedRoles={['formateur']} />}
        />
        <Route
          path="/trainings"
          element={<PrivateRoute element={<TrainingPage />} allowedRoles={['apprenant']} />}
        />
        <Route
          path="/formateur/trainings"
          element={<PrivateRoute element={<FormateurTrainingPage />} allowedRoles={['formateur']} />}
        />
        <Route
          path="/emargement"
          element={<PrivateRoute element={<Emargement />} allowedRoles={['apprenant']} />}
        />
        <Route
          path="/formateur/participants-emargement"
          element={<PrivateRoute element={<ParticipantsEmargement />} allowedRoles={['formateur']} />}
        />
        <Route
          path="/admin-dashboard"
          element={<PrivateRoute element={<AdminDashboard />} allowedRoles={['admin']} />}
        />
        <Route
          path="/admin/learners"
          element={<PrivateRoute element={<ApprenantAdmin />} allowedRoles={['admin']} />}
        />
        <Route
          path="/admin/trainers"
          element={<PrivateRoute element={<TrainerManagement />} allowedRoles={['admin']} />}
        />
        <Route
          path="/admin/history"
          element={<PrivateRoute element={<History />} allowedRoles={['admin']} />}
        />
        <Route
          path="/admin/statistics"
          element={<PrivateRoute element={<StatAdmin />} allowedRoles={['admin']} />}
        />
        <Route
          path="/apprenant/statistics"
          element={<PrivateRoute element={<StatApprenant />} allowedRoles={['apprenant']} />}
        />
        <Route
          path="/validation-acquis"
          element={<PrivateRoute element={<ValidationAcquis />} allowedRoles={['apprenant']} />}
        />
        <Route
          path="/feedback"
          element={<PrivateRoute element={<FeedbackPage />} allowedRoles={['apprenant']} />}
        />
        <Route
          path="/validation"
          element={<PrivateRoute element={<ValidationFormateur />} allowedRoles={['formateur']} />}
        />
        <Route
          path="/formateur/statistiques"
          element={<PrivateRoute element={<FormateurStatistique />} allowedRoles={['formateur']} />}
        />

        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Router>
  );
};

export default App;


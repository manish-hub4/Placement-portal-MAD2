from flask_restful import Api

api = Api(prefix='/api')

from .auth import Register, Login, TokenRefresh, CurrentUser, Logout
from .admin_api import (
    AdminDashboard,
    AdminCompanyList, AdminCompanyDetail,
    AdminStudentList, AdminStudentDetail,
    AdminDriveList, AdminDriveDetail,
    AdminApplicationList,
    AdminAnalytics,
    AdminSearch,
)
from .company_api import (
    CompanyDashboard,
    CompanyProfileResource,
    CompanyDriveList, CompanyDriveDetail,
    CompanyApplicationList, CompanyApplicationDetail,
)
from .student_api import (
    StudentDashboard,
    StudentProfileResource,
    StudentDriveList, StudentDriveDetail,
    StudentApply,
    StudentApplicationList, StudentApplicationDetail,
    StudentExportApplications,
)
from .dashboard_api import AdminDashView, CompanyDashView, StudentDashView, DashboardRedirect
from .celery_api import TriggerDailyReminders, TriggerMonthlyReport, TaskStatus, ClearCache

# ── Auth ─────────────────────────────────────────────────────────────────────
api.add_resource(Register,     '/register')
api.add_resource(Login,        '/login')
api.add_resource(TokenRefresh, '/refresh')
api.add_resource(CurrentUser,  '/me')
api.add_resource(Logout,       '/logout')

# ── Admin ─────────────────────────────────────────────────────────────────────
api.add_resource(AdminDashboard,      '/admin/dashboard')
api.add_resource(AdminCompanyList,    '/admin/companies')
api.add_resource(AdminCompanyDetail,  '/admin/companies/<int:company_id>')
api.add_resource(AdminStudentList,    '/admin/students')
api.add_resource(AdminStudentDetail,  '/admin/students/<int:student_id>')
api.add_resource(AdminDriveList,      '/admin/drives')
api.add_resource(AdminDriveDetail,    '/admin/drives/<int:drive_id>')
api.add_resource(AdminApplicationList,'/admin/applications')
api.add_resource(AdminAnalytics,      '/admin/analytics')
api.add_resource(AdminSearch,         '/admin/search')

# ── Dashboard (role-specific quick stats) ─────────────────────────────────────
api.add_resource(AdminDashView,    '/dashboard/admin')
api.add_resource(CompanyDashView,  '/dashboard/company')
api.add_resource(StudentDashView,  '/dashboard/student')
api.add_resource(DashboardRedirect,'/dashboard/redirect')

# ── Company ───────────────────────────────────────────────────────────────────
api.add_resource(CompanyDashboard,          '/company/dashboard')
api.add_resource(CompanyProfileResource,    '/company/profile')
api.add_resource(CompanyDriveList,          '/company/drives')
api.add_resource(CompanyDriveDetail,        '/company/drives/<int:drive_id>')
api.add_resource(CompanyApplicationList,    '/company/drives/<int:drive_id>/applications')
api.add_resource(CompanyApplicationDetail,  '/company/drives/<int:drive_id>/applications/<int:application_id>')

# ── Student ───────────────────────────────────────────────────────────────────
api.add_resource(StudentDashboard,          '/student/dashboard')
api.add_resource(StudentProfileResource,    '/student/profile')
api.add_resource(StudentDriveList,          '/student/drives')
api.add_resource(StudentDriveDetail,        '/student/drives/<int:drive_id>')
api.add_resource(StudentApply,              '/student/drives/<int:drive_id>/apply')
api.add_resource(StudentApplicationList,    '/student/applications')
api.add_resource(StudentApplicationDetail,  '/student/applications/<int:application_id>')
api.add_resource(StudentExportApplications, '/student/applications/export')

# ── Celery / Admin Tasks ──────────────────────────────────────────────────────
api.add_resource(TriggerDailyReminders, '/admin/tasks/reminders')
api.add_resource(TriggerMonthlyReport,  '/admin/tasks/monthly-report')
api.add_resource(TaskStatus,            '/admin/tasks/status/<string:task_id>')
api.add_resource(ClearCache,            '/admin/cache/clear')

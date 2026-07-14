from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from flask_restful import Resource

from db.company import CompanyProfile
from db.student import StudentProfile
from db.placement_drive import PlacementDrive
from db.application import Application


class DashboardRedirect(Resource):
    @jwt_required()
    def get(self):
        role = get_jwt().get('role')
        paths = {
            'admin':   '/admin',
            'company': '/company',
            'student': '/student',
        }
        return {'redirect': paths.get(role, '/')}, 200


class AdminDashView(Resource):
    @jwt_required()
    def get(self):
        role = get_jwt().get('role')
        if role != 'admin':
            return {'error': 'Admin access required'}, 403
        return {
            'total_students':  StudentProfile.query.count(),
            'total_companies': CompanyProfile.query.filter_by(approval_status='Approved').count(),
            'total_drives':    PlacementDrive.query.count(),
            'pending_approvals': {
                'companies': CompanyProfile.query.filter_by(approval_status='Pending').count(),
                'drives':    PlacementDrive.query.filter_by(status='Pending').count(),
            },
            'total_selected':  Application.query.filter_by(status='Selected').count(),
        }, 200


class CompanyDashView(Resource):
    @jwt_required()
    def get(self):
        role = get_jwt().get('role')
        if role != 'company':
            return {'error': 'Company access required'}, 403
        user_id = get_jwt_identity()
        company = CompanyProfile.query.filter_by(user_id=int(user_id)).first()
        if not company:
            return {'error': 'Company profile not found'}, 404
        return {
            'company_name':    company.company_name,
            'approval_status': company.approval_status,
            'total_drives':    company.placement_drives.count(),
            'total_applications': sum(d.applications.count() for d in company.placement_drives.all()),
        }, 200


class StudentDashView(Resource):
    @jwt_required()
    def get(self):
        role = get_jwt().get('role')
        if role != 'student':
            return {'error': 'Student access required'}, 403
        user_id = get_jwt_identity()
        student = StudentProfile.query.filter_by(user_id=int(user_id)).first()
        if not student:
            return {'error': 'Student profile not found'}, 404
        apps = student.applications.all()
        return {
            'full_name':      f"{student.first_name} {student.last_name}",
            'total_applied':  len(apps),
            'selected':       sum(1 for a in apps if a.status == 'Selected'),
            'shortlisted':    sum(1 for a in apps if a.status == 'Shortlisted'),
        }, 200

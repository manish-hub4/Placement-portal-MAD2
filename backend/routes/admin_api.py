from datetime import date

from flask import request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from flask_restful import Resource

from db import db
from db.user import User
from db.company import CompanyProfile
from db.student import StudentProfile
from db.placement_drive import PlacementDrive
from db.application import Application
from extensions import cache


def _admin_only():
    return get_jwt().get('role') == 'admin'


class AdminDashboard(Resource):
    @jwt_required()
    def get(self):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        total_students  = StudentProfile.query.count()
        total_companies = CompanyProfile.query.count()
        total_drives    = PlacementDrive.query.count()
        total_apps      = Application.query.count()
        pending_companies = CompanyProfile.query.filter_by(approval_status='Pending').count()
        pending_drives    = PlacementDrive.query.filter_by(status='Pending').count()
        selected_apps     = Application.query.filter_by(status='Selected').count()

        recent_drives = PlacementDrive.query.order_by(PlacementDrive.created_at.desc()).limit(5).all()
        recent_apps   = Application.query.order_by(Application.created_at.desc()).limit(5).all()

        return {
            'stats': {
                'total_students':      total_students,
                'total_companies':     total_companies,
                'total_drives':        total_drives,
                'total_applications':  total_apps,
                'pending_companies':   pending_companies,
                'pending_drives':      pending_drives,
                'selected_students':   selected_apps,
            },
            'recent_drives': [d.to_dict() for d in recent_drives],
            'recent_applications': [a.to_dict() for a in recent_apps],
        }, 200


class AdminCompanyList(Resource):
    @jwt_required()
    def get(self):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        status    = request.args.get('status')
        search    = request.args.get('search', '').strip()
        page      = int(request.args.get('page', 1))
        per_page  = int(request.args.get('per_page', 20))

        q = CompanyProfile.query
        if status:
            q = q.filter_by(approval_status=status)
        if search:
            q = q.filter(CompanyProfile.company_name.ilike(f'%{search}%'))
        q = q.order_by(CompanyProfile.created_at.desc())
        total = q.count()
        companies = q.offset((page - 1) * per_page).limit(per_page).all()
        return {
            'companies': [c.to_dict() for c in companies],
            'total': total, 'page': page, 'per_page': per_page,
        }, 200


class AdminCompanyDetail(Resource):
    @jwt_required()
    def get(self, company_id):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        company = CompanyProfile.query.get_or_404(company_id)
        drives  = [d.to_dict() for d in company.placement_drives.all()]
        data    = company.to_dict()
        data['drives'] = drives
        return data, 200

    @jwt_required()
    def put(self, company_id):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        company = CompanyProfile.query.get_or_404(company_id)
        data    = request.get_json(silent=True) or {}

        # Admin can approve/reject/blacklist
        if 'approval_status' in data:
            if data['approval_status'] not in ('Approved', 'Rejected', 'Pending'):
                return {'error': 'Invalid approval_status'}, 400
            company.approval_status = data['approval_status']
            # Notify company via email (async)
            try:
                from tasks.email_tasks import task_send_company_approval_notification
                task_send_company_approval_notification.delay(company_id, data['approval_status'])
            except Exception:
                pass

        if 'is_blacklisted' in data:
            company.is_blacklisted = bool(data['is_blacklisted'])
            user = User.query.get(company.user_id)
            if user:
                user.active = not company.is_blacklisted
        if 'admin_remarks' in data:
            company.admin_remarks = data['admin_remarks']

        db.session.commit()
        return company.to_dict(), 200

    @jwt_required()
    def delete(self, company_id):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        company = CompanyProfile.query.get_or_404(company_id)
        user    = User.query.get(company.user_id)
        db.session.delete(company)
        if user:
            db.session.delete(user)
        db.session.commit()
        return {'message': 'Company deleted successfully'}, 200


class AdminStudentList(Resource):
    @jwt_required()
    def get(self):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        search   = request.args.get('search', '').strip()
        branch   = request.args.get('branch', '').strip()
        page     = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))

        q = StudentProfile.query
        if search:
            q = q.filter(
                db.or_(
                    StudentProfile.first_name.ilike(f'%{search}%'),
                    StudentProfile.last_name.ilike(f'%{search}%'),
                    StudentProfile.roll_number.ilike(f'%{search}%'),
                )
            )
        if branch:
            q = q.filter_by(branch=branch)
        total    = q.count()
        students = q.order_by(StudentProfile.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
        return {
            'students': [s.to_dict() for s in students],
            'total': total, 'page': page, 'per_page': per_page,
        }, 200


class AdminStudentDetail(Resource):
    @jwt_required()
    def get(self, student_id):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        student = StudentProfile.query.get_or_404(student_id)
        data    = student.to_dict()
        data['applications'] = [a.to_dict() for a in student.applications.all()]
        return data, 200

    @jwt_required()
    def put(self, student_id):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        student = StudentProfile.query.get_or_404(student_id)
        data    = request.get_json(silent=True) or {}
        if 'is_active' in data:
            student.is_active = bool(data['is_active'])
            user = User.query.get(student.user_id)
            if user:
                user.active = student.is_active
        db.session.commit()
        return student.to_dict(), 200

    @jwt_required()
    def delete(self, student_id):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        student = StudentProfile.query.get_or_404(student_id)
        user    = User.query.get(student.user_id)
        db.session.delete(student)
        if user:
            db.session.delete(user)
        db.session.commit()
        return {'message': 'Student deleted successfully'}, 200


class AdminDriveList(Resource):
    @jwt_required()
    def get(self):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        status   = request.args.get('status')
        search   = request.args.get('search', '').strip()
        page     = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))

        q = PlacementDrive.query
        if status:
            q = q.filter_by(status=status)
        if search:
            q = q.filter(PlacementDrive.job_title.ilike(f'%{search}%'))
        total  = q.count()
        drives = q.order_by(PlacementDrive.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
        return {
            'drives': [d.to_dict() for d in drives],
            'total': total, 'page': page, 'per_page': per_page,
        }, 200


class AdminDriveDetail(Resource):
    @jwt_required()
    def get(self, drive_id):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        drive = PlacementDrive.query.get_or_404(drive_id)
        data  = drive.to_dict()
        data['applications'] = [a.to_dict() for a in drive.applications.all()]
        return data, 200

    @jwt_required()
    def put(self, drive_id):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        drive = PlacementDrive.query.get_or_404(drive_id)
        data  = request.get_json(silent=True) or {}

        if 'status' in data:
            if data['status'] not in ('Approved', 'Rejected', 'Closed', 'Pending'):
                return {'error': 'Invalid status'}, 400
            drive.status = data['status']
            try:
                from tasks.email_tasks import task_send_drive_approval_notification
                task_send_drive_approval_notification.delay(drive_id, data['status'])
            except Exception:
                pass
        if 'admin_remarks' in data:
            drive.admin_remarks = data['admin_remarks']

        db.session.commit()
        return drive.to_dict(), 200


class AdminApplicationList(Resource):
    @jwt_required()
    def get(self):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        status   = request.args.get('status')
        page     = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))

        q = Application.query
        if status:
            q = q.filter_by(status=status)
        total = q.count()
        apps  = q.order_by(Application.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
        return {
            'applications': [a.to_dict() for a in apps],
            'total': total, 'page': page, 'per_page': per_page,
        }, 200


class AdminAnalytics(Resource):
    @jwt_required()
    @cache.cached(timeout=300, key_prefix='admin_analytics')
    def get(self):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403

        # Applications by status
        statuses   = ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected']
        by_status  = {s: Application.query.filter_by(status=s).count() for s in statuses}

        # Drives by status
        drive_statuses = ['Pending', 'Approved', 'Rejected', 'Closed']
        drives_by_status = {s: PlacementDrive.query.filter_by(status=s).count() for s in drive_statuses}

        # Top companies by applications
        from sqlalchemy import func
        top_companies = (
            db.session.query(CompanyProfile.company_name, func.count(Application.id).label('count'))
            .join(PlacementDrive, PlacementDrive.company_id == CompanyProfile.id)
            .join(Application, Application.drive_id == PlacementDrive.id)
            .group_by(CompanyProfile.id)
            .order_by(func.count(Application.id).desc())
            .limit(5).all()
        )

        # Branch-wise selection
        branch_selection = (
            db.session.query(StudentProfile.branch, func.count(Application.id).label('count'))
            .join(Application, Application.student_id == StudentProfile.id)
            .filter(Application.status == 'Selected')
            .group_by(StudentProfile.branch)
            .all()
        )

        return {
            'applications_by_status': by_status,
            'drives_by_status':       drives_by_status,
            'top_companies':          [{'name': c[0], 'count': c[1]} for c in top_companies],
            'branch_selection':       [{'branch': b[0], 'count': b[1]} for b in branch_selection],
            'total_students':         StudentProfile.query.count(),
            'total_companies':        CompanyProfile.query.filter_by(approval_status='Approved').count(),
            'total_drives':           PlacementDrive.query.filter_by(status='Approved').count(),
            'placement_rate':         round(
                Application.query.filter_by(status='Selected').count() /
                max(StudentProfile.query.count(), 1) * 100, 2
            ),
        }, 200


class AdminSearch(Resource):
    @jwt_required()
    def get(self):
        if not _admin_only():
            return {'error': 'Admin access required'}, 403
        q    = request.args.get('q', '').strip()
        kind = request.args.get('type', 'all')  # student | company | drive | all
        if not q:
            return {'error': 'Search query required'}, 400

        results = {}
        if kind in ('student', 'all'):
            students = StudentProfile.query.filter(
                db.or_(
                    StudentProfile.first_name.ilike(f'%{q}%'),
                    StudentProfile.last_name.ilike(f'%{q}%'),
                    StudentProfile.roll_number.ilike(f'%{q}%'),
                    StudentProfile.branch.ilike(f'%{q}%'),
                )
            ).limit(10).all()
            results['students'] = [s.to_dict() for s in students]

        if kind in ('company', 'all'):
            companies = CompanyProfile.query.filter(
                db.or_(
                    CompanyProfile.company_name.ilike(f'%{q}%'),
                    CompanyProfile.industry.ilike(f'%{q}%'),
                )
            ).limit(10).all()
            results['companies'] = [c.to_dict() for c in companies]

        if kind in ('drive', 'all'):
            drives = PlacementDrive.query.filter(
                db.or_(
                    PlacementDrive.job_title.ilike(f'%{q}%'),
                    PlacementDrive.location.ilike(f'%{q}%'),
                )
            ).limit(10).all()
            results['drives'] = [d.to_dict() for d in drives]

        return results, 200

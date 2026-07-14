from datetime import date

from flask import request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from flask_restful import Resource

from db import db
from db.company import CompanyProfile
from db.placement_drive import PlacementDrive
from db.application import Application


def _company_only():
    return get_jwt().get('role') == 'company'


def _get_company(user_id):
    return CompanyProfile.query.filter_by(user_id=int(user_id)).first()


class CompanyDashboard(Resource):
    @jwt_required()
    def get(self):
        if not _company_only():
            return {'error': 'Company access required'}, 403
        company = _get_company(get_jwt_identity())
        if not company:
            return {'error': 'Company profile not found'}, 404

        drives       = company.placement_drives.all()
        total_drives = len(drives)
        total_apps   = sum(d.applications.count() for d in drives)
        shortlisted  = sum(d.applications.filter_by(status='Shortlisted').count() for d in drives)
        selected     = sum(d.applications.filter_by(status='Selected').count() for d in drives)

        recent_drives = company.placement_drives.order_by(PlacementDrive.created_at.desc()).limit(5).all()
        recent_apps   = (Application.query
                         .join(PlacementDrive)
                         .filter(PlacementDrive.company_id == company.id)
                         .order_by(Application.created_at.desc())
                         .limit(5).all())

        return {
            'company': company.to_dict(),
            'stats': {
                'total_drives':        total_drives,
                'total_applications':  total_apps,
                'shortlisted':         shortlisted,
                'selected':            selected,
                'approval_status':     company.approval_status,
            },
            'recent_drives':      [d.to_dict() for d in recent_drives],
            'recent_applications': [a.to_dict() for a in recent_apps],
        }, 200


class CompanyProfileResource(Resource):
    @jwt_required()
    def get(self):
        if not _company_only():
            return {'error': 'Company access required'}, 403
        company = _get_company(get_jwt_identity())
        if not company:
            return {'error': 'Company profile not found'}, 404
        return company.to_dict(), 200

    @jwt_required()
    def put(self):
        if not _company_only():
            return {'error': 'Company access required'}, 403
        company = _get_company(get_jwt_identity())
        if not company:
            return {'error': 'Company profile not found'}, 404
        data = request.get_json(silent=True) or {}

        updatable = ['company_name', 'industry', 'website', 'hr_name', 'hr_email',
                     'hr_phone', 'description', 'company_size', 'headquarters']
        for field in updatable:
            if field in data:
                setattr(company, field, data[field])

        db.session.commit()
        return company.to_dict(), 200


class CompanyDriveList(Resource):
    @jwt_required()
    def get(self):
        if not _company_only():
            return {'error': 'Company access required'}, 403
        company = _get_company(get_jwt_identity())
        if not company:
            return {'error': 'Company profile not found'}, 404
        if company.approval_status != 'Approved':
            return {'error': 'Company not yet approved by admin'}, 403

        status = request.args.get('status')
        q = company.placement_drives
        if status:
            q = q.filter_by(status=status)
        drives = q.order_by(PlacementDrive.created_at.desc()).all()
        return {'drives': [d.to_dict() for d in drives]}, 200

    @jwt_required()
    def post(self):
        if not _company_only():
            return {'error': 'Company access required'}, 403
        company = _get_company(get_jwt_identity())
        if not company:
            return {'error': 'Company profile not found'}, 404
        if company.approval_status != 'Approved':
            return {'error': 'Company must be approved by admin before creating drives'}, 403
        if company.is_blacklisted:
            return {'error': 'Company is blacklisted'}, 403

        data = request.get_json(silent=True) or {}
        required = ['job_title', 'job_description', 'application_deadline']
        for field in required:
            if not data.get(field):
                return {'error': f'{field} is required'}, 400

        try:
            deadline = date.fromisoformat(data['application_deadline'])
        except ValueError:
            return {'error': 'Invalid application_deadline format (YYYY-MM-DD)'}, 400

        if deadline <= date.today():
            return {'error': 'Application deadline must be in the future'}, 400

        branches = data.get('eligible_branches', [])
        branches_str = ','.join(branches) if isinstance(branches, list) else branches

        drive = PlacementDrive(
            company_id          = company.id,
            job_title           = data['job_title'].strip(),
            job_description     = data['job_description'].strip(),
            job_type            = data.get('job_type', 'Full-time'),
            location            = data.get('location', '').strip() or None,
            salary_min          = data.get('salary_min'),
            salary_max          = data.get('salary_max'),
            eligible_branches   = branches_str or None,
            min_cgpa            = float(data.get('min_cgpa', 0.0)),
            eligible_year       = int(data['eligible_year']) if data.get('eligible_year') else None,
            min_tenth_percent   = float(data.get('min_tenth_percent', 0.0)),
            min_twelfth_percent = float(data.get('min_twelfth_percent', 0.0)),
            application_deadline = deadline,
            max_applications    = int(data['max_applications']) if data.get('max_applications') else None,
            status              = 'Pending',
        )
        db.session.add(drive)
        db.session.commit()
        return drive.to_dict(), 201


class CompanyDriveDetail(Resource):
    @jwt_required()
    def get(self, drive_id):
        if not _company_only():
            return {'error': 'Company access required'}, 403
        company = _get_company(get_jwt_identity())
        drive   = PlacementDrive.query.filter_by(id=drive_id, company_id=company.id).first()
        if not drive:
            return {'error': 'Drive not found'}, 404
        data = drive.to_dict()
        data['applications'] = [a.to_dict() for a in drive.applications.all()]
        return data, 200

    @jwt_required()
    def put(self, drive_id):
        if not _company_only():
            return {'error': 'Company access required'}, 403
        company = _get_company(get_jwt_identity())
        drive   = PlacementDrive.query.filter_by(id=drive_id, company_id=company.id).first()
        if not drive:
            return {'error': 'Drive not found'}, 404
        if drive.status == 'Closed':
            return {'error': 'Cannot edit a closed drive'}, 400

        data = request.get_json(silent=True) or {}
        updatable = ['job_title', 'job_description', 'job_type', 'location',
                     'salary_min', 'salary_max', 'min_cgpa', 'eligible_year',
                     'min_tenth_percent', 'min_twelfth_percent', 'max_applications']
        for field in updatable:
            if field in data:
                setattr(drive, field, data[field])

        if 'eligible_branches' in data:
            branches = data['eligible_branches']
            drive.eligible_branches = ','.join(branches) if isinstance(branches, list) else branches
        if 'application_deadline' in data:
            drive.application_deadline = date.fromisoformat(data['application_deadline'])
        if 'status' in data and data['status'] == 'Closed':
            drive.status = 'Closed'

        # Re-set to Pending if core fields changed (requires re-approval)
        if any(f in data for f in ['job_title', 'job_description', 'eligible_branches', 'min_cgpa']):
            if drive.status == 'Approved':
                drive.status = 'Pending'

        db.session.commit()
        return drive.to_dict(), 200


class CompanyApplicationList(Resource):
    """List all applications for a specific drive."""
    @jwt_required()
    def get(self, drive_id):
        if not _company_only():
            return {'error': 'Company access required'}, 403
        company = _get_company(get_jwt_identity())
        drive   = PlacementDrive.query.filter_by(id=drive_id, company_id=company.id).first()
        if not drive:
            return {'error': 'Drive not found'}, 404

        status = request.args.get('status')
        q = drive.applications
        if status:
            q = q.filter_by(status=status)
        apps = q.order_by(Application.created_at.asc()).all()
        return {'applications': [a.to_dict() for a in apps], 'drive': drive.to_dict()}, 200


class CompanyApplicationDetail(Resource):
    """Update application status (shortlist, schedule interview, select/reject)."""
    @jwt_required()
    def put(self, drive_id, application_id):
        if not _company_only():
            return {'error': 'Company access required'}, 403
        company = _get_company(get_jwt_identity())
        drive   = PlacementDrive.query.filter_by(id=drive_id, company_id=company.id).first()
        if not drive:
            return {'error': 'Drive not found'}, 404
        app = Application.query.filter_by(id=application_id, drive_id=drive_id).first()
        if not app:
            return {'error': 'Application not found'}, 404

        data = request.get_json(silent=True) or {}
        valid_statuses = ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected']

        if 'status' in data:
            if data['status'] not in valid_statuses:
                return {'error': f'Invalid status. Must be one of: {valid_statuses}'}, 400
            app.status = data['status']
            # Fire async email notification to student
            try:
                from tasks.email_tasks import task_send_status_update
                task_send_status_update.delay(application_id)
            except Exception:
                pass

        if 'company_remarks' in data:
            app.company_remarks = data['company_remarks']
        if 'interview_date' in data:
            from datetime import datetime
            app.interview_date = datetime.fromisoformat(data['interview_date'])
        if 'interview_mode' in data:
            app.interview_mode = data['interview_mode']

        db.session.commit()
        return app.to_dict(), 200

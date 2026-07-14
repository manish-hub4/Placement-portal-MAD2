from datetime import date

from flask import request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from flask_restful import Resource

from db import db
from db.student import StudentProfile
from db.placement_drive import PlacementDrive
from db.application import Application
from extensions import cache


def _student_only():
    return get_jwt().get('role') == 'student'


def _get_student(user_id):
    return StudentProfile.query.filter_by(user_id=int(user_id)).first()


def _check_eligibility(student, drive):
    """Returns (eligible: bool, reason: str)."""
    errors = []

    # Branch check
    if drive.eligible_branches:
        allowed = [b.strip() for b in drive.eligible_branches.split(',')]
        if student.branch and student.branch not in allowed:
            errors.append(f'Branch {student.branch} not eligible (allowed: {", ".join(allowed)})')

    # CGPA check
    if drive.min_cgpa and student.cgpa is not None:
        if student.cgpa < drive.min_cgpa:
            errors.append(f'CGPA {student.cgpa} below required {drive.min_cgpa}')

    # Graduation year check
    if drive.eligible_year and student.graduation_year:
        if student.graduation_year != drive.eligible_year:
            errors.append(f'Graduation year {student.graduation_year} does not match required {drive.eligible_year}')

    # 10th percent
    if drive.min_tenth_percent and student.tenth_percent is not None:
        if student.tenth_percent < drive.min_tenth_percent:
            errors.append(f'10th % {student.tenth_percent} below required {drive.min_tenth_percent}')

    # 12th percent
    if drive.min_twelfth_percent and student.twelfth_percent is not None:
        if student.twelfth_percent < drive.min_twelfth_percent:
            errors.append(f'12th % {student.twelfth_percent} below required {drive.min_twelfth_percent}')

    if errors:
        return False, '; '.join(errors)
    return True, ''


class StudentDashboard(Resource):
    @jwt_required()
    def get(self):
        if not _student_only():
            return {'error': 'Student access required'}, 403
        student = _get_student(get_jwt_identity())
        if not student:
            return {'error': 'Student profile not found'}, 404

        apps       = student.applications.all()
        selected   = sum(1 for a in apps if a.status == 'Selected')
        shortlisted= sum(1 for a in apps if a.status == 'Shortlisted')
        rejected   = sum(1 for a in apps if a.status == 'Rejected')

        # Upcoming drives the student hasn't applied to yet
        applied_ids = [a.drive_id for a in apps]
        upcoming = (PlacementDrive.query
                    .filter_by(status='Approved')
                    .filter(PlacementDrive.application_deadline >= date.today())
                    .filter(~PlacementDrive.id.in_(applied_ids) if applied_ids else True)
                    .order_by(PlacementDrive.application_deadline.asc())
                    .limit(5).all())

        return {
            'student': student.to_dict(),
            'stats': {
                'total_applied':  len(apps),
                'selected':       selected,
                'shortlisted':    shortlisted,
                'rejected':       rejected,
            },
            'recent_applications': [a.to_dict() for a in sorted(apps, key=lambda x: x.created_at, reverse=True)[:5]],
            'upcoming_drives':    [d.to_dict() for d in upcoming],
        }, 200


class StudentProfileResource(Resource):
    @jwt_required()
    def get(self):
        if not _student_only():
            return {'error': 'Student access required'}, 403
        student = _get_student(get_jwt_identity())
        if not student:
            return {'error': 'Student profile not found'}, 404
        return student.to_dict(), 200

    @jwt_required()
    def put(self):
        if not _student_only():
            return {'error': 'Student access required'}, 403
        student = _get_student(get_jwt_identity())
        if not student:
            return {'error': 'Student profile not found'}, 404

        data = request.get_json(silent=True) or {}
        updatable = ['first_name', 'last_name', 'phone', 'gender', 'address',
                     'branch', 'cgpa', 'graduation_year', 'tenth_percent',
                     'twelfth_percent', 'skills', 'roll_number']
        for field in updatable:
            if field in data:
                setattr(student, field, data[field])

        db.session.commit()
        return student.to_dict(), 200


class StudentDriveList(Resource):
    @jwt_required()
    @cache.cached(timeout=120, key_prefix=lambda: f'student_drives_{get_jwt_identity()}')
    def get(self):
        if not _student_only():
            return {'error': 'Student access required'}, 403
        student = _get_student(get_jwt_identity())
        if not student:
            return {'error': 'Student profile not found'}, 404

        search    = request.args.get('search', '').strip()
        job_type  = request.args.get('job_type', '').strip()
        eligible_only = request.args.get('eligible_only', 'false').lower() == 'true'

        q = PlacementDrive.query.filter_by(status='Approved').filter(
            PlacementDrive.application_deadline >= date.today()
        )
        if search:
            q = q.filter(
                db.or_(
                    PlacementDrive.job_title.ilike(f'%{search}%'),
                    PlacementDrive.location.ilike(f'%{search}%'),
                )
            )
        if job_type:
            q = q.filter_by(job_type=job_type)

        drives = q.order_by(PlacementDrive.application_deadline.asc()).all()

        # Get already-applied drive IDs
        applied_ids = {a.drive_id for a in student.applications.all()}

        result = []
        for d in drives:
            data = d.to_dict()
            data['already_applied'] = d.id in applied_ids
            if eligible_only:
                eligible, _ = _check_eligibility(student, d)
                if not eligible:
                    continue
            else:
                eligible, reason = _check_eligibility(student, d)
                data['is_eligible'] = eligible
                data['eligibility_reason'] = reason if not eligible else ''
            result.append(data)

        return {'drives': result, 'total': len(result)}, 200


class StudentDriveDetail(Resource):
    @jwt_required()
    def get(self, drive_id):
        if not _student_only():
            return {'error': 'Student access required'}, 403
        student = _get_student(get_jwt_identity())
        drive   = PlacementDrive.query.filter_by(id=drive_id, status='Approved').first()
        if not drive:
            return {'error': 'Drive not found or not approved'}, 404

        data = drive.to_dict()
        existing = Application.query.filter_by(student_id=student.id, drive_id=drive_id).first()
        data['already_applied'] = existing is not None
        if existing:
            data['application'] = existing.to_dict()

        eligible, reason = _check_eligibility(student, drive)
        data['is_eligible']        = eligible
        data['eligibility_reason'] = reason if not eligible else ''
        return data, 200


class StudentApply(Resource):
    @jwt_required()
    def post(self, drive_id):
        if not _student_only():
            return {'error': 'Student access required'}, 403
        student = _get_student(get_jwt_identity())
        if not student:
            return {'error': 'Student profile not found'}, 404
        if not student.is_active:
            return {'error': 'Your account is deactivated'}, 403

        drive = PlacementDrive.query.filter_by(id=drive_id, status='Approved').first()
        if not drive:
            return {'error': 'Drive not found or not approved'}, 404
        if drive.application_deadline < date.today():
            return {'error': 'Application deadline has passed'}, 400

        # Duplicate check
        existing = Application.query.filter_by(student_id=student.id, drive_id=drive_id).first()
        if existing:
            return {'error': 'You have already applied to this drive'}, 409

        # Max applications check
        if drive.max_applications:
            count = drive.applications.count()
            if count >= drive.max_applications:
                return {'error': 'This drive has reached its maximum number of applications'}, 400

        # Eligibility check
        eligible, reason = _check_eligibility(student, drive)
        if not eligible:
            return {'error': f'You are not eligible: {reason}'}, 400

        data = request.get_json(silent=True) or {}
        application = Application(
            student_id       = student.id,
            drive_id         = drive_id,
            application_date = date.today(),
            status           = 'Applied',
            cover_letter     = data.get('cover_letter', '').strip() or None,
        )
        db.session.add(application)
        db.session.commit()

        # Fire async confirmation email
        try:
            from tasks.email_tasks import task_send_application_confirmation
            task_send_application_confirmation.delay(application.id)
        except Exception:
            pass

        return application.to_dict(), 201


class StudentApplicationList(Resource):
    @jwt_required()
    def get(self):
        if not _student_only():
            return {'error': 'Student access required'}, 403
        student = _get_student(get_jwt_identity())
        if not student:
            return {'error': 'Student profile not found'}, 404

        status = request.args.get('status')
        q = student.applications
        if status:
            q = q.filter_by(status=status)
        apps = q.order_by(Application.created_at.desc()).all()
        return {'applications': [a.to_dict() for a in apps]}, 200


class StudentApplicationDetail(Resource):
    @jwt_required()
    def get(self, application_id):
        if not _student_only():
            return {'error': 'Student access required'}, 403
        student = _get_student(get_jwt_identity())
        app = Application.query.filter_by(id=application_id, student_id=student.id).first()
        if not app:
            return {'error': 'Application not found'}, 404
        return app.to_dict(), 200

    @jwt_required()
    def delete(self, application_id):
        """Withdraw application (only if still 'Applied')."""
        if not _student_only():
            return {'error': 'Student access required'}, 403
        student = _get_student(get_jwt_identity())
        app = Application.query.filter_by(id=application_id, student_id=student.id).first()
        if not app:
            return {'error': 'Application not found'}, 404
        if app.status != 'Applied':
            return {'error': 'Cannot withdraw an application that has already been processed'}, 400
        db.session.delete(app)
        db.session.commit()
        return {'message': 'Application withdrawn successfully'}, 200


class StudentExportApplications(Resource):
    @jwt_required()
    def post(self):
        if not _student_only():
            return {'error': 'Student access required'}, 403
        student = _get_student(get_jwt_identity())
        if not student:
            return {'error': 'Student profile not found'}, 404

        try:
            from tasks.user_tasks import task_export_student_applications
            result = task_export_student_applications.delay(student.id)
            return {
                'message': 'Export started. You will receive an email with the CSV shortly.',
                'task_id': result.id,
            }, 202
        except Exception as e:
            return {'error': str(e)}, 500

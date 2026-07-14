"""
tasks/user_tasks.py
User-triggered asynchronous batch jobs via Celery.
"""
import csv
import io
import os
import sys

_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from celery_app import celery


@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def task_export_student_applications(self, student_id: int):
    """
    Generates a CSV export of the student's placement application history
    and emails it to them.
    Triggered by: POST /student/applications/export
    """
    try:
        from db.student import StudentProfile
        from db.application import Application
        from db.placement_drive import PlacementDrive
        from db.company import CompanyProfile
        from services.email_service import send_student_export

        student = StudentProfile.query.get(student_id)
        if not student or not student.user:
            return 'Student not found or has no linked user account'

        # Fetch all applications with related data
        applications = (
            Application.query
            .filter_by(student_id=student_id)
            .order_by(Application.created_at.desc())
            .all()
        )

        # Generate CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            'Application ID',
            'Student ID',
            'Roll Number',
            'Student Name',
            'Company Name',
            'Drive Title',
            'Job Type',
            'Location',
            'Application Date',
            'Application Status',
            'Interview Date',
            'Interview Mode',
            'Company Remarks',
            'Deadline',
        ])

        for app in applications:
            drive   = app.drive
            company = drive.company if drive else None
            writer.writerow([
                app.id,
                student.user_id,
                student.roll_number or '',
                f'{student.first_name} {student.last_name}',
                company.company_name if company else '',
                drive.job_title if drive else '',
                drive.job_type if drive else '',
                drive.location or '' if drive else '',
                app.application_date.isoformat() if app.application_date else '',
                app.status,
                app.interview_date.isoformat() if app.interview_date else '',
                app.interview_mode or '',
                app.company_remarks or '',
                drive.application_deadline.isoformat() if drive and drive.application_deadline else '',
            ])

        csv_data = output.getvalue()
        output.close()

        # Email with attachment
        send_student_export(student, csv_data)

        return f'Successfully exported {len(applications)} applications and emailed to {student.user.email}'

    except Exception as exc:
        raise self.retry(exc=exc)

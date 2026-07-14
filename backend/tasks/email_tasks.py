"""
tasks/email_tasks.py
Event-driven Celery tasks — fired immediately when key events happen in the API.
"""
import os
import sys

_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from celery_app import celery


@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def task_send_application_confirmation(self, application_id: int):
    """
    Sends booking confirmation email to the student.
    Triggered by: POST /student/drives/<id>/apply
    """
    try:
        from db.application import Application
        from services.email_service import send_application_confirmation
        application = Application.query.get(application_id)
        if application:
            send_application_confirmation(application)
    except Exception as exc:
        raise self.retry(exc=exc)


@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def task_send_status_update(self, application_id: int):
    """
    Sends status update email to the student.
    Triggered by: PUT /company/drives/<id>/applications/<id>
    """
    try:
        from db.application import Application
        from services.email_service import send_status_update
        application = Application.query.get(application_id)
        if application:
            send_status_update(application)
    except Exception as exc:
        raise self.retry(exc=exc)


@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def task_send_company_approval_notification(self, company_id: int, status: str):
    """
    Sends approval/rejection email to the company.
    Triggered by: PUT /admin/companies/<id>
    """
    try:
        from db.company import CompanyProfile
        from services.email_service import send_company_approval
        company = CompanyProfile.query.get(company_id)
        if company:
            send_company_approval(company, status)
    except Exception as exc:
        raise self.retry(exc=exc)


@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def task_send_drive_approval_notification(self, drive_id: int, status: str):
    """
    Sends drive approval/rejection email to the company.
    Triggered by: PUT /admin/drives/<id>
    """
    try:
        from db.placement_drive import PlacementDrive
        from services.email_service import send_drive_approval
        drive = PlacementDrive.query.get(drive_id)
        if drive:
            send_drive_approval(drive, status)
    except Exception as exc:
        raise self.retry(exc=exc)

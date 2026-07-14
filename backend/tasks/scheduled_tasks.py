"""
tasks/scheduled_tasks.py
Celery Beat periodic tasks — run on a defined schedule.

Run the scheduler:
    celery -A celery_app.celery beat --loglevel=info
"""
import os
import sys
from datetime import date, timedelta

_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from celery.schedules import crontab
from celery.utils.log import get_task_logger
from celery_app import celery

logger = get_task_logger(__name__)


# ── 1. Daily deadline reminders (8:00 AM) ─────────────────────────────────────

@celery.task(name='tasks.send_daily_deadline_reminders')
def send_daily_deadline_reminders():
    """
    Sends reminders to students about drives whose deadline is tomorrow.
    Runs daily at 8:00 AM IST.
    """
    from db.placement_drive import PlacementDrive
    from db.application import Application
    from services.email_service import send_deadline_reminder

    tomorrow = date.today() + timedelta(days=1)

    # Find all approved drives with deadline tomorrow
    drives = PlacementDrive.query.filter_by(
        status='Approved',
        application_deadline=tomorrow,
    ).all()

    sent = 0
    for drive in drives:
        # Notify all students who have applied
        applications = drive.applications.filter_by(status='Applied').all()
        for app in applications:
            try:
                send_deadline_reminder(app)
                sent += 1
            except Exception as exc:
                logger.error(f'Reminder failed for application #{app.id}: {exc}')

    logger.info(f'[Daily Reminders] Sent {sent} reminders for {tomorrow}')
    return {'date': str(tomorrow), 'sent': sent}


# ── 2. Monthly admin report (1st of month, 7:00 AM) ───────────────────────────

@celery.task(name='tasks.send_monthly_admin_report')
def send_monthly_admin_report():
    """
    Generates and emails a monthly placement activity report to admin.
    Runs on the 1st of every month at 7:00 AM IST.
    """
    from db.placement_drive import PlacementDrive
    from db.application import Application
    from db.student import StudentProfile
    from db.company import CompanyProfile
    from db import db
    from sqlalchemy import func, cast, Date
    from services.email_service import send_monthly_report_to_admin

    today = date.today()
    first_of_this_month = today.replace(day=1)
    last_of_prev_month  = first_of_this_month - timedelta(days=1)
    first_of_prev_month = last_of_prev_month.replace(day=1)
    report_month = first_of_prev_month.strftime('%B %Y')

    # Applications in previous month
    apps_in_month = Application.query.filter(
        cast(Application.created_at, Date) >= first_of_prev_month,
        cast(Application.created_at, Date) <= last_of_prev_month,
    ).all()

    # Drives in previous month
    drives_in_month = PlacementDrive.query.filter(
        cast(PlacementDrive.created_at, Date) >= first_of_prev_month,
        cast(PlacementDrive.created_at, Date) <= last_of_prev_month,
    ).all()

    # New registrations in previous month
    new_students = StudentProfile.query.filter(
        cast(StudentProfile.created_at, Date) >= first_of_prev_month,
        cast(StudentProfile.created_at, Date) <= last_of_prev_month,
    ).count()

    new_companies = CompanyProfile.query.filter(
        cast(CompanyProfile.created_at, Date) >= first_of_prev_month,
        cast(CompanyProfile.created_at, Date) <= last_of_prev_month,
    ).count()

    # Top drives by applications
    top_drives_data = (
        db.session.query(
            PlacementDrive.job_title,
            CompanyProfile.company_name,
            func.count(Application.id).label('app_count'),
            func.sum(db.case((Application.status == 'Selected', 1), else_=0)).label('selected_count'),
        )
        .join(Application, Application.drive_id == PlacementDrive.id)
        .join(CompanyProfile, CompanyProfile.id == PlacementDrive.company_id)
        .filter(
            cast(Application.created_at, Date) >= first_of_prev_month,
            cast(Application.created_at, Date) <= last_of_prev_month,
        )
        .group_by(PlacementDrive.id)
        .order_by(func.count(Application.id).desc())
        .limit(10).all()
    )

    stats = {
        'month':              report_month,
        'total_drives':       len(drives_in_month),
        'total_applications': len(apps_in_month),
        'selected':           sum(1 for a in apps_in_month if a.status == 'Selected'),
        'shortlisted':        sum(1 for a in apps_in_month if a.status == 'Shortlisted'),
        'rejected':           sum(1 for a in apps_in_month if a.status == 'Rejected'),
        'new_students':       new_students,
        'new_companies':      new_companies,
        'top_drives': [
            {
                'title':        row.job_title,
                'company':      row.company_name,
                'applications': row.app_count,
                'selected':     row.selected_count or 0,
            }
            for row in top_drives_data
        ],
    }

    try:
        send_monthly_report_to_admin(stats)
        logger.info(f'[Monthly Report] Sent for {report_month}')
    except Exception as exc:
        logger.error(f'[Monthly Report] Failed: {exc}')

    return {'month': report_month, 'total_applications': stats['total_applications']}


# ── Beat schedule ──────────────────────────────────────────────────────────────

DEMO_MODE = False

if DEMO_MODE:
    # Every minute — useful for quick testing
    celery.conf.beat_schedule = {
        'daily-deadline-reminders': {
            'task': 'tasks.send_daily_deadline_reminders',
            'schedule': crontab(),
        },
        'monthly-admin-report': {
            'task': 'tasks.send_monthly_admin_report',
            'schedule': crontab(),
        },
    }
else:
    celery.conf.beat_schedule = {
        # 8:00 AM IST every day
        'daily-deadline-reminders': {
            'task': 'tasks.send_daily_deadline_reminders',
            'schedule': crontab(hour=8, minute=0),
        },
        # 7:00 AM IST on the 1st of every month
        'monthly-admin-report': {
            'task': 'tasks.send_monthly_admin_report',
            'schedule': crontab(hour=7, minute=0, day_of_month=1),
        },
    }

"""
services/email_service.py
All email helper functions for the Placement Portal.
Emails are delivered via MailHog (SMTP on port 1025).
Web UI: http://localhost:8025
"""

from datetime import date

from flask import current_app
from flask_mail import Message

from extensions import mail


def _send(msg: Message):
    """Send a message and swallow any connection errors gracefully."""
    try:
        mail.send(msg)
    except Exception as exc:
        current_app.logger.error(f'[Email] Failed to send "{msg.subject}": {exc}')


# ── 1. Application confirmation → Student ─────────────────────────────────────

def send_application_confirmation(application):
    """
    Sent to the student immediately after successfully applying for a drive.
    Triggers: POST /student/drives/<id>/apply
    """
    student = application.student
    drive   = application.drive
    company = drive.company if drive else None

    if not (student and student.user):
        return

    deadline = drive.application_deadline.strftime('%d %B %Y') if drive and drive.application_deadline else '—'

    body = f"""
Dear {student.first_name} {student.last_name},

Your application has been submitted successfully!

  Company       : {company.company_name if company else '—'}
  Job Title     : {drive.job_title if drive else '—'}
  Job Type      : {drive.job_type if drive else '—'}
  Location      : {drive.location or 'Not specified'}
  Deadline      : {deadline}
  Status        : Applied

You will be notified by email when your application status is updated.
Log in to the Placement Portal to track your application.

Best regards,
Placement Portal Team
    """.strip()

    msg = Message(
        subject=f'✅ Application Submitted — {drive.job_title if drive else "Placement Drive"}',
        recipients=[student.user.email],
        body=body,
    )
    _send(msg)


# ── 2. Application status update → Student ────────────────────────────────────

def send_status_update(application):
    """
    Sent to the student when the company updates their application status.
    Triggers: PUT /company/drives/<id>/applications/<id>
    """
    student = application.student
    drive   = application.drive
    company = drive.company if drive else None

    if not (student and student.user):
        return

    status_messages = {
        'Shortlisted': 'Congratulations! You have been shortlisted for the next round.',
        'Interview':   f'You have been scheduled for an interview on {application.interview_date.strftime("%d %B %Y at %I:%M %p") if application.interview_date else "a date to be confirmed"} ({application.interview_mode or "mode TBD"}).',
        'Selected':    '🎉 Congratulations! You have been SELECTED for this position!',
        'Rejected':    'We regret to inform you that your application was not selected at this time. Keep applying!',
    }
    message = status_messages.get(application.status, f'Your application status has been updated to: {application.status}')

    body = f"""
Dear {student.first_name} {student.last_name},

Your application status has been updated:

  Company   : {company.company_name if company else '—'}
  Job Title : {drive.job_title if drive else '—'}
  Status    : {application.status}

{message}

{f'Company remarks: {application.company_remarks}' if application.company_remarks else ''}

Log in to the Placement Portal to view full details.

Best regards,
Placement Portal Team
    """.strip()

    subject_icons = {
        'Shortlisted': '📋', 'Interview': '📅',
        'Selected': '🎉', 'Rejected': 'ℹ️',
    }
    icon = subject_icons.get(application.status, '🔔')

    msg = Message(
        subject=f'{icon} Application Update: {application.status} — {drive.job_title if drive else "Drive"}',
        recipients=[student.user.email],
        body=body,
    )
    _send(msg)


# ── 3. Company approval notification → Company ────────────────────────────────

def send_company_approval(company, status: str):
    """
    Sent to the company when admin approves or rejects their registration.
    Triggers: PUT /admin/companies/<id>
    """
    if not (company and company.user):
        return

    if status == 'Approved':
        body = f"""
Dear {company.hr_name or company.company_name},

Great news! Your company registration has been APPROVED by the institute.

You can now log in to the Placement Portal and start creating placement drives.

  Company : {company.company_name}
  Status  : Approved

Best regards,
Placement Portal — Institute Placement Cell
        """.strip()
        subject = f'✅ Company Registration Approved — {company.company_name}'
    else:
        body = f"""
Dear {company.hr_name or company.company_name},

We regret to inform you that your company registration has been REJECTED.

  Company       : {company.company_name}
  Status        : Rejected
  Admin Remarks : {company.admin_remarks or 'No remarks provided'}

Please contact the placement cell for further information.

Best regards,
Placement Portal — Institute Placement Cell
        """.strip()
        subject = f'❌ Company Registration Rejected — {company.company_name}'

    msg = Message(subject=subject, recipients=[company.user.email], body=body)
    _send(msg)


# ── 4. Drive approval notification → Company ──────────────────────────────────

def send_drive_approval(drive, status: str):
    """
    Sent to the company when admin approves or rejects their placement drive.
    Triggers: PUT /admin/drives/<id>
    """
    company = drive.company
    if not (company and company.user):
        return

    if status == 'Approved':
        body = f"""
Dear {company.hr_name or company.company_name},

Your placement drive has been APPROVED and is now visible to students.

  Drive     : {drive.job_title}
  Job Type  : {drive.job_type}
  Deadline  : {drive.application_deadline.strftime('%d %B %Y') if drive.application_deadline else '—'}
  Status    : Approved

Students can now view and apply for this drive.

Best regards,
Placement Portal — Institute Placement Cell
        """.strip()
        subject = f'✅ Placement Drive Approved — {drive.job_title}'
    else:
        body = f"""
Dear {company.hr_name or company.company_name},

Your placement drive has been REJECTED.

  Drive         : {drive.job_title}
  Status        : Rejected
  Admin Remarks : {drive.admin_remarks or 'No remarks provided'}

Please make necessary changes and resubmit for approval.

Best regards,
Placement Portal — Institute Placement Cell
        """.strip()
        subject = f'❌ Placement Drive Rejected — {drive.job_title}'

    msg = Message(subject=subject, recipients=[company.user.email], body=body)
    _send(msg)


# ── 5. Deadline reminder → Students ───────────────────────────────────────────

def send_deadline_reminder(application):
    """
    Sent to students who have upcoming application deadlines tomorrow.
    Triggers: Celery Beat daily at 8:00 AM.
    """
    student = application.student
    drive   = application.drive
    company = drive.company if drive else None

    if not (student and student.user):
        return

    deadline = drive.application_deadline.strftime('%A, %d %B %Y') if drive and drive.application_deadline else '—'

    body = f"""
Dear {student.first_name} {student.last_name},

⏰ REMINDER: The following placement drive deadline is approaching tomorrow:

  Company   : {company.company_name if company else '—'}
  Job Title : {drive.job_title if drive else '—'}
  Deadline  : {deadline}
  Status    : {application.status}

Please check the Placement Portal for any updates on your application.

Best regards,
Placement Portal Team
    """.strip()

    msg = Message(
        subject=f'⏰ Deadline Reminder: {drive.job_title if drive else "Placement Drive"} — Tomorrow!',
        recipients=[student.user.email],
        body=body,
    )
    _send(msg)


# ── 6. Monthly admin report ────────────────────────────────────────────────────

def send_monthly_report_to_admin(stats: dict):
    """
    Sent to admin on the 1st of every month with the previous month's activity.
    Triggers: Celery Beat on 1st of month at 7:00 AM.
    """
    admin_email = current_app.config.get('ADMIN_EMAIL', 'admin@placement-portal.com')
    month_str   = stats.get('month', date.today().strftime('%B %Y'))

    # Build top-drives rows separately to avoid backslashes inside f-string expressions
    top_drive_rows = ''.join(
        '<tr style="background:{bg}"><td>{company}</td><td>{title}</td>'
        '<td>{apps}</td><td>{sel}</td></tr>'.format(
            bg='#f1f5f9' if i % 2 == 0 else 'white',
            company=d['company'],
            title=d['title'],
            apps=d['applications'],
            sel=d['selected'],
        )
        for i, d in enumerate(stats.get('top_drives', []))
    )

    # Build HTML report body
    html_body = f"""
<html><body style="font-family: Arial, sans-serif; max-width: 800px; margin: auto;">
<h2 style="color:#1e40af;">📊 Monthly Placement Activity Report — {month_str}</h2>
<hr/>
<h3>Summary Statistics</h3>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
  <tr style="background:#1e40af;color:white">
    <th>Metric</th><th>Count</th>
  </tr>
  <tr><td>Drives Conducted</td><td>{stats.get('total_drives', 0)}</td></tr>
  <tr style="background:#f1f5f9"><td>Total Applications</td><td>{stats.get('total_applications', 0)}</td></tr>
  <tr><td>Students Selected</td><td>{stats.get('selected', 0)}</td></tr>
  <tr style="background:#f1f5f9"><td>Students Shortlisted</td><td>{stats.get('shortlisted', 0)}</td></tr>
  <tr><td>Students Rejected</td><td>{stats.get('rejected', 0)}</td></tr>
  <tr style="background:#f1f5f9"><td>New Companies Registered</td><td>{stats.get('new_companies', 0)}</td></tr>
  <tr><td>New Students Registered</td><td>{stats.get('new_students', 0)}</td></tr>
</table>

<h3>Top Drives by Applications</h3>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
  <tr style="background:#1e40af;color:white">
    <th>Company</th><th>Job Title</th><th>Applications</th><th>Selected</th>
  </tr>
  {top_drive_rows}
</table>

<p style="color:#6b7280;font-size:12px;margin-top:20px;">
  This is an automated monthly report generated by the Placement Portal system.
</p>
</body></html>
    """.strip()

    plain_body = f"""
PLACEMENT PORTAL — MONTHLY ACTIVITY REPORT
Month: {month_str}

SUMMARY
-------
Drives Conducted      : {stats.get('total_drives', 0)}
Total Applications    : {stats.get('total_applications', 0)}
Students Selected     : {stats.get('selected', 0)}
Students Shortlisted  : {stats.get('shortlisted', 0)}
Students Rejected     : {stats.get('rejected', 0)}
New Companies         : {stats.get('new_companies', 0)}
New Students          : {stats.get('new_students', 0)}

This is an automated report.
    """.strip()

    msg = Message(
        subject=f'📊 Monthly Placement Report — {month_str}',
        recipients=[admin_email],
        body=plain_body,
        html=html_body,
    )
    _send(msg)


# ── 7. Student CSV export delivery ────────────────────────────────────────────

def send_student_export(student, csv_data: str):
    """
    Sent to the student with their application history as a CSV attachment.
    Triggers: POST /student/applications/export
    """
    if not (student and student.user):
        return

    body = f"""
Dear {student.first_name} {student.last_name},

Your application history export is ready and attached to this email.

The CSV file contains your complete placement application history including
company names, drive titles, application dates, and current statuses.

Best regards,
Placement Portal Team
    """.strip()

    msg = Message(
        subject='📄 Your Application History Export — Placement Portal',
        recipients=[student.user.email],
        body=body,
    )

    filename = f'applications_{student.roll_number or student.id}_{date.today().strftime("%Y%m%d")}.csv'
    msg.attach(
        filename=filename,
        content_type='text/csv',
        data=csv_data.encode('utf-8'),
    )
    _send(msg)

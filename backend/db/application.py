from datetime import datetime
from db import db


class Application(db.Model):
    __tablename__ = 'applications'

    id               = db.Column(db.Integer, primary_key=True)
    student_id       = db.Column(db.Integer, db.ForeignKey('student_profiles.id'), nullable=False)
    drive_id         = db.Column(db.Integer, db.ForeignKey('placement_drives.id'), nullable=False)
    application_date = db.Column(db.Date, nullable=False)

    # Status workflow: Applied → Shortlisted → Interview → Selected | Rejected
    status           = db.Column(db.String(20), default='Applied')

    cover_letter     = db.Column(db.Text)
    company_remarks  = db.Column(db.Text)
    admin_remarks    = db.Column(db.Text)
    interview_date   = db.Column(db.DateTime)
    interview_mode   = db.Column(db.String(50))   # Online | In-person

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Prevent a student from applying twice to the same drive
    __table_args__ = (
        db.UniqueConstraint('student_id', 'drive_id', name='uq_student_drive'),
        db.Index('idx_student_id',   'student_id'),
        db.Index('idx_drive_id',     'drive_id'),
        db.Index('idx_app_status',   'status'),
    )

    def to_dict(self):
        return {
            'id':               self.id,
            'student_id':       self.student_id,
            'drive_id':         self.drive_id,
            'student_name':     f"{self.student.first_name} {self.student.last_name}" if self.student else None,
            'student_email':    self.student.user.email if self.student and self.student.user else None,
            'student_roll':     self.student.roll_number if self.student else None,
            'student_branch':   self.student.branch if self.student else None,
            'student_cgpa':     self.student.cgpa if self.student else None,
            'drive_title':      self.drive.job_title if self.drive else None,
            'company_name':     self.drive.company.company_name if self.drive and self.drive.company else None,
            'application_date': self.application_date.isoformat() if self.application_date else None,
            'status':           self.status,
            'cover_letter':     self.cover_letter,
            'company_remarks':  self.company_remarks,
            'admin_remarks':    self.admin_remarks,
            'interview_date':   self.interview_date.isoformat() if self.interview_date else None,
            'interview_mode':   self.interview_mode,
            'created_at':       self.created_at.isoformat() if self.created_at else None,
            'updated_at':       self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<Application Student:{self.student_id} Drive:{self.drive_id} Status:{self.status}>'

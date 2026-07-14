from datetime import datetime
from sqlalchemy.orm import relationship
from db import db


class PlacementDrive(db.Model):
    __tablename__ = 'placement_drives'

    id                  = db.Column(db.Integer, primary_key=True)
    company_id          = db.Column(db.Integer, db.ForeignKey('company_profiles.id'), nullable=False)
    job_title           = db.Column(db.String(200), nullable=False)
    job_description     = db.Column(db.Text, nullable=False)
    job_type            = db.Column(db.String(50), default='Full-time')  # Full-time | Internship | Contract
    location            = db.Column(db.String(200))
    salary_min          = db.Column(db.Numeric(12, 2))
    salary_max          = db.Column(db.Numeric(12, 2))

    # Eligibility criteria
    eligible_branches   = db.Column(db.Text)     # comma-separated: "CSE,ECE,IT"
    min_cgpa            = db.Column(db.Float, default=0.0)
    eligible_year       = db.Column(db.Integer)  # graduation year
    min_tenth_percent   = db.Column(db.Float, default=0.0)
    min_twelfth_percent = db.Column(db.Float, default=0.0)

    application_deadline = db.Column(db.Date, nullable=False)
    max_applications     = db.Column(db.Integer)  # None = unlimited

    # Admin approval workflow
    status        = db.Column(db.String(20), default='Pending')  # Pending | Approved | Rejected | Closed
    admin_remarks = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    applications = relationship('Application', backref='drive', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        branches = [b.strip() for b in self.eligible_branches.split(',')] if self.eligible_branches else []
        return {
            'id':                   self.id,
            'company_id':           self.company_id,
            'company_name':         self.company.company_name if self.company else None,
            'job_title':            self.job_title,
            'job_description':      self.job_description,
            'job_type':             self.job_type,
            'location':             self.location,
            'salary_min':           float(self.salary_min) if self.salary_min else None,
            'salary_max':           float(self.salary_max) if self.salary_max else None,
            'eligible_branches':    branches,
            'min_cgpa':             self.min_cgpa,
            'eligible_year':        self.eligible_year,
            'min_tenth_percent':    self.min_tenth_percent,
            'min_twelfth_percent':  self.min_twelfth_percent,
            'application_deadline': self.application_deadline.isoformat() if self.application_deadline else None,
            'max_applications':     self.max_applications,
            'status':               self.status,
            'admin_remarks':        self.admin_remarks,
            'applications_count':   self.applications.count(),
            'created_at':           self.created_at.isoformat() if self.created_at else None,
            'updated_at':           self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<PlacementDrive {self.job_title} @ Company:{self.company_id}>'

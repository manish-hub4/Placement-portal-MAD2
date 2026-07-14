from datetime import datetime
from sqlalchemy.orm import relationship
from db import db


class StudentProfile(db.Model):
    __tablename__ = 'student_profiles'

    id              = db.Column(db.Integer, primary_key=True)
    user_id         = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    first_name      = db.Column(db.String(100), nullable=False)
    last_name       = db.Column(db.String(100), nullable=False)
    phone           = db.Column(db.String(20))
    date_of_birth   = db.Column(db.Date)
    gender          = db.Column(db.String(10))
    address         = db.Column(db.Text)

    # Academic details
    roll_number       = db.Column(db.String(50), unique=True)
    branch            = db.Column(db.String(100))   # e.g. CSE, ECE, ME, CE
    cgpa              = db.Column(db.Float, default=0.0)
    graduation_year   = db.Column(db.Integer)
    tenth_percent     = db.Column(db.Float)
    twelfth_percent   = db.Column(db.Float)
    skills            = db.Column(db.Text)           # comma-separated
    resume_filename   = db.Column(db.String(255))

    is_active   = db.Column(db.Boolean, default=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    applications = relationship('Application', backref='student', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':               self.id,
            'user_id':          self.user_id,
            'first_name':       self.first_name,
            'last_name':        self.last_name,
            'full_name':        f"{self.first_name} {self.last_name}",
            'phone':            self.phone,
            'date_of_birth':    self.date_of_birth.isoformat() if self.date_of_birth else None,
            'gender':           self.gender,
            'address':          self.address,
            'roll_number':      self.roll_number,
            'branch':           self.branch,
            'cgpa':             self.cgpa,
            'graduation_year':  self.graduation_year,
            'tenth_percent':    self.tenth_percent,
            'twelfth_percent':  self.twelfth_percent,
            'skills':           self.skills,
            'resume_filename':  self.resume_filename,
            'is_active':        self.is_active,
            'email':            self.user.email    if self.user else None,
            'username':         self.user.username if self.user else None,
            'applications_count': self.applications.count(),
            'created_at':       self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<StudentProfile {self.first_name} {self.last_name}>'

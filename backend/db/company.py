from datetime import datetime
from sqlalchemy.orm import relationship
from db import db


class CompanyProfile(db.Model):
    __tablename__ = 'company_profiles'

    id              = db.Column(db.Integer, primary_key=True)
    user_id         = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    company_name    = db.Column(db.String(200), nullable=False)
    industry        = db.Column(db.String(100))
    website         = db.Column(db.String(255))
    hr_name         = db.Column(db.String(100))
    hr_email        = db.Column(db.String(150))
    hr_phone        = db.Column(db.String(20))
    description     = db.Column(db.Text)
    company_size    = db.Column(db.String(50))   # e.g. "1-50", "51-200", "200+"
    headquarters    = db.Column(db.String(200))
    logo_filename   = db.Column(db.String(255))

    # Admin approval workflow
    approval_status = db.Column(db.String(20), default='Pending')  # Pending | Approved | Rejected
    admin_remarks   = db.Column(db.Text)
    is_blacklisted  = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    placement_drives = relationship('PlacementDrive', backref='company', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':              self.id,
            'user_id':         self.user_id,
            'company_name':    self.company_name,
            'industry':        self.industry,
            'website':         self.website,
            'hr_name':         self.hr_name,
            'hr_email':        self.hr_email,
            'hr_phone':        self.hr_phone,
            'description':     self.description,
            'company_size':    self.company_size,
            'headquarters':    self.headquarters,
            'approval_status': self.approval_status,
            'admin_remarks':   self.admin_remarks,
            'is_blacklisted':  self.is_blacklisted,
            'email':           self.user.email    if self.user else None,
            'username':        self.user.username if self.user else None,
            'drives_count':    self.placement_drives.count(),
            'created_at':      self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<CompanyProfile {self.company_name}>'

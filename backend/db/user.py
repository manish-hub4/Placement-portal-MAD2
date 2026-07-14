from datetime import datetime

from flask_security import RoleMixin, UserMixin, SQLAlchemyUserDatastore
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash

from db import db


class Role(db.Model, RoleMixin):
    __tablename__ = 'role'

    id          = db.Column(db.Integer(), primary_key=True)
    name        = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

    def __repr__(self):
        return f'<Role {self.name}>'


class RolesUsers(db.Model):
    __tablename__ = 'roles_users'

    id      = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column(db.Integer(), db.ForeignKey('user.id'))
    role_id = db.Column(db.Integer(), db.ForeignKey('role.id'))


class User(db.Model, UserMixin):
    __tablename__ = 'user'

    id       = db.Column(db.Integer, primary_key=True)
    email    = db.Column(db.String(150), unique=True, nullable=False, index=True)
    username = db.Column(db.String(150), unique=True, nullable=True, index=True)
    password = db.Column(db.String(255), nullable=False)

    # role tag to identify admin, company, or student
    role = db.Column(db.String(20), nullable=True)

    # managed by flask-security
    active           = db.Column(db.Boolean(), default=True)
    fs_uniquifier    = db.Column(db.String(255), unique=True, nullable=False)
    login_count      = db.Column(db.Integer, default=0)
    last_login_at    = db.Column(db.DateTime)
    current_login_at = db.Column(db.DateTime)
    last_login_ip    = db.Column(db.String(100))
    current_login_ip = db.Column(db.String(100))
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at       = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    roles = db.relationship(
        'Role',
        secondary='roles_users',
        backref=db.backref('users', lazy='dynamic')
    )

    # one-to-one link to company or student profile
    company_profile = relationship('CompanyProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    student_profile = relationship('StudentProfile', backref='user', uselist=False, cascade='all, delete-orphan')

    def set_password(self, raw_password):
        self.password = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        return check_password_hash(self.password, raw_password)

    def to_dict(self):
        return {
            'id':         self.id,
            'username':   self.username,
            'email':      self.email,
            'role':       self.role,
            'is_active':  self.active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<User {self.username} ({self.role})>'


user_datastore = SQLAlchemyUserDatastore(db, User, Role)

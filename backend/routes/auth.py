import re
import uuid
from datetime import timedelta

from flask import request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)
from flask_restful import Resource

from db import db
from db.company import CompanyProfile
from db.student import StudentProfile
from db.user import User


def validate_email(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password: str):
    if len(password) < 6:
        return False, 'Password must be at least 6 characters long'
    return True, ''


def _profile_for(user: User):
    if user.role == 'student' and user.student_profile:
        return user.student_profile.to_dict()
    if user.role == 'company' and user.company_profile:
        return user.company_profile.to_dict()
    if user.role == 'admin':
        return {'id': user.id, 'username': user.username, 'email': user.email, 'role': 'admin'}
    return None


class Register(Resource):
    """Register a new Student or Company."""
    def post(self):
        data = request.get_json(silent=True) or {}

        role = data.get('role', '').strip().lower()
        if role not in ('student', 'company'):
            return {'error': 'Role must be student or company'}, 400

        required = ['username', 'email', 'password']
        for field in required:
            if not data.get(field):
                return {'error': f'{field} is required'}, 400

        username = data['username'].strip()
        email    = data['email'].strip().lower()
        password = data['password']

        if not validate_email(email):
            return {'error': 'Invalid email format'}, 400

        ok, err = validate_password(password)
        if not ok:
            return {'error': err}, 400

        if User.query.filter_by(username=username).first():
            return {'error': 'Username already exists'}, 400
        if User.query.filter_by(email=email).first():
            return {'error': 'Email already registered'}, 400

        try:
            user = User(
                username=username,
                email=email,
                role=role,
                fs_uniquifier=str(uuid.uuid4()),
                active=True,
            )
            user.set_password(password)
            db.session.add(user)
            db.session.flush()

            if role == 'student':
                if not data.get('first_name') or not data.get('last_name'):
                    return {'error': 'first_name and last_name are required for students'}, 400
                profile = StudentProfile(
                    user_id=user.id,
                    first_name=data['first_name'].strip(),
                    last_name=data['last_name'].strip(),
                    phone=data.get('phone', '').strip() or None,
                    roll_number=data.get('roll_number', '').strip() or None,
                    branch=data.get('branch', '').strip() or None,
                    cgpa=float(data['cgpa']) if data.get('cgpa') else 0.0,
                    graduation_year=int(data['graduation_year']) if data.get('graduation_year') else None,
                )
            else:  # company
                if not data.get('company_name'):
                    return {'error': 'company_name is required for companies'}, 400
                profile = CompanyProfile(
                    user_id=user.id,
                    company_name=data['company_name'].strip(),
                    industry=data.get('industry', '').strip() or None,
                    website=data.get('website', '').strip() or None,
                    hr_name=data.get('hr_name', '').strip() or None,
                    hr_email=data.get('hr_email', email).strip(),
                    hr_phone=data.get('hr_phone', '').strip() or None,
                    approval_status='Pending',
                )

            db.session.add(profile)
            db.session.commit()

        except Exception as exc:
            db.session.rollback()
            return {'error': f'Registration failed: {str(exc)}'}, 500

        return {
            'message': f'{role.capitalize()} registered successfully',
            'user': {
                'id': user.id, 'username': user.username,
                'email': user.email, 'role': user.role,
            }
        }, 201


class Login(Resource):
    """Login for all roles: admin, company, student."""
    def post(self):
        data = request.get_json(silent=True) or {}

        if not data.get('username') or not data.get('password'):
            return {'error': 'Username and password are required'}, 400

        username = data['username'].strip()
        password = data['password']

        user = User.query.filter_by(username=username).first()
        if not user or not user.check_password(password):
            return {'error': 'Invalid username or password'}, 401

        if not user.active:
            return {'error': 'Account is inactive. Please contact administrator.'}, 403

        try:
            access_token = create_access_token(
                identity=str(user.id),
                additional_claims={'role': user.role, 'username': user.username},
                expires_delta=timedelta(hours=24),
            )
            refresh_token = create_refresh_token(
                identity=str(user.id),
                additional_claims={'role': user.role, 'username': user.username},
            )
        except Exception as exc:
            return {'error': f'Login failed: {str(exc)}'}, 500

        return {
            'message':       'Login successful',
            'access_token':  access_token,
            'refresh_token': refresh_token,
            'user': {
                'id':       user.id,
                'username': user.username,
                'email':    user.email,
                'role':     user.role,
                'profile':  _profile_for(user),
            },
        }, 200


class TokenRefresh(Resource):
    @jwt_required(refresh=True)
    def post(self):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user or not user.active:
            return {'error': 'User not found or inactive'}, 401
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role, 'username': user.username},
        )
        return {'access_token': access_token}, 200


class CurrentUser(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user:
            return {'error': 'User not found'}, 404
        return {
            'user': {
                'id':        user.id,
                'username':  user.username,
                'email':     user.email,
                'role':      user.role,
                'is_active': user.active,
                'profile':   _profile_for(user),
            }
        }, 200


class Logout(Resource):
    @jwt_required()
    def post(self):
        return {'message': 'Logged out successfully'}, 200

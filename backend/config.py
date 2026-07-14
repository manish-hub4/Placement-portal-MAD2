import os
from datetime import timedelta


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'placement-portal-secret-key-change-me')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)

    # SQLite db stored next to app.py
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'sqlite:///' + os.path.join(os.path.dirname(__file__), 'placement.db')
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT token lifetimes
    JWT_ACCESS_TOKEN_EXPIRES  = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # Flask-Security settings
    SECURITY_PASSWORD_SALT              = os.environ.get('SECURITY_PASSWORD_SALT', 'placement-salt')
    SECURITY_TOKEN_AUTHENTICATION_HEADER = 'Authorization'
    WTF_CSRF_ENABLED                    = False  # API-only, no CSRF needed

    DEBUG = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'

    # Redis
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

    # Celery
    CELERY_BROKER_URL    = os.environ.get('CELERY_BROKER_URL',    'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND= os.environ.get('CELERY_RESULT_BACKEND','redis://localhost:6379/0')
    CELERY_TIMEZONE      = 'Asia/Kolkata'
    CELERY_ENABLE_UTC    = False

    # Flask-Caching (Redis backend)
    CACHE_TYPE            = 'RedisCache'
    CACHE_REDIS_URL       = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_DEFAULT_TIMEOUT = 300   # 5 minutes default

    # Flask-Mail (MailHog SMTP)
    MAIL_SERVER         = os.environ.get('MAIL_SERVER',   'localhost')
    MAIL_PORT           = int(os.environ.get('MAIL_PORT', 1025))
    MAIL_USE_TLS        = False
    MAIL_USE_SSL        = False
    MAIL_USERNAME       = None
    MAIL_PASSWORD       = None
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@placement-portal.com')
    MAIL_SUPPRESS_SEND  = False

    # Admin email — reports are delivered here
    ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@placement-portal.com')

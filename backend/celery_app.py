"""
celery_app.py — Celery entry point

Start the worker (Windows users must use --pool=solo):
    celery -A celery_app.celery worker --pool=solo --loglevel=info

Start the Beat scheduler (for periodic tasks) IN A SEPARATE TERMINAL:
    celery -A celery_app.celery beat --loglevel=info
"""

import os
import sys

# Ensure the backend directory is on sys.path so all packages are importable
_backend_dir = os.path.abspath(os.path.dirname(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from app import app, make_celery

celery = make_celery(app)


class _ContextTask(celery.Task):
    """Override base Task so Flask app context is always active."""
    abstract = True

    def __call__(self, *args, **kwargs):
        if _backend_dir not in sys.path:
            sys.path.insert(0, _backend_dir)
        with app.app_context():
            return self.run(*args, **kwargs)


celery.Task = _ContextTask

# Import task modules so Celery discovers them at worker startup
import tasks.email_tasks       # event-driven email tasks
import tasks.scheduled_tasks   # beat periodic tasks
import tasks.user_tasks        # user-triggered batch tasks

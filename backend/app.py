import os
import uuid

# pyrefly: ignore [missing-import]
from celery import Celery
# pyrefly: ignore [missing-import]
from flask import Flask, send_from_directory
# pyrefly: ignore [missing-import]
from flask_jwt_extended import JWTManager
from flask_security import Security
from flask_cors import CORS

from config import Config
from db import db, register_models, user_datastore
from extensions import mail, cache


def make_celery(app: Flask) -> Celery:
    """Create and configure the Celery instance bound to the Flask app."""
    celery_app = Celery(
        app.import_name,
        broker=app.config['CELERY_BROKER_URL'],
        backend=app.config['CELERY_RESULT_BACKEND'],
    )
    celery_app.conf.update(
        timezone=app.config.get('CELERY_TIMEZONE', 'Asia/Kolkata'),
        enable_utc=app.config.get('CELERY_ENABLE_UTC', False),
        broker_connection_retry_on_startup=True,
        task_serializer='json',
        result_serializer='json',
        accept_content=['json'],
        task_always_eager=app.config.get('CELERY_TASK_ALWAYS_EAGER', False),
    )

    class ContextTask(celery_app.Task):
        """Tasks run inside Flask application context."""
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app.Task = ContextTask
    return celery_app


def _is_redis_available(redis_url):
    import redis
    try:
        r = redis.Redis.from_url(redis_url, socket_timeout=1.0)
        r.ping()
        return True
    except Exception:
        return False


def create_app():
    app = Flask(__name__, static_folder='../frontend/static', static_url_path='/static')
    app.config.from_object(Config)

    # Check if Redis is running; fallback to local SimpleCache and eager Celery tasks if not.
    redis_url = app.config.get('REDIS_URL', 'redis://localhost:6379/0')
    if not _is_redis_available(redis_url):
        print("[Warning] Redis server not found. Falling back to SimpleCache and Celery eager mode.")
        app.config['CACHE_TYPE'] = 'SimpleCache'
        app.config['CELERY_TASK_ALWAYS_EAGER'] = True
    else:
        app.config['CELERY_TASK_ALWAYS_EAGER'] = False

    # Enable CORS for Vue CDN frontend
    CORS(app, resources={r'/api/*': {'origins': '*'}})

    # Init extensions
    db.init_app(app)
    JWTManager(app)
    Security(app, user_datastore)
    mail.init_app(app)
    cache.init_app(app)

    # Register all API routes
    from routes import api
    api.init_app(app)

    # Serve frontend index.html for all non-API routes
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend')
        return send_from_directory(frontend_dir, 'index.html')

    with app.app_context():
        register_models()
        db.create_all()
        _seed_admin()

    return app


def _seed_admin():
    """Create the one admin account if it doesn't exist yet."""
    from db.user import User

    if User.query.filter_by(role='admin').first():
        return  # already seeded

    admin = User(
        username='admin',
        email=os.environ.get('ADMIN_EMAIL', 'admin@placement-portal.com'),
        role='admin',
        fs_uniquifier=str(uuid.uuid4()),
        active=True,
    )
    admin.set_password(os.environ.get('ADMIN_PASSWORD', 'Admin@123'))
    db.session.add(admin)
    db.session.commit()
    print('[Success] Admin account created -> username: admin / password: Admin@123')


app = create_app()

if __name__ == '__main__':
    app.run(debug=app.config.get('DEBUG', True))

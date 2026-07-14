from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def register_models():
    """Import all model files so SQLAlchemy picks up the tables."""
    from db import user
    from db import company
    from db import student
    from db import placement_drive
    from db import application


from db.user        import Role, RolesUsers, User, user_datastore
from db.company     import CompanyProfile
from db.student     import StudentProfile
from db.placement_drive import PlacementDrive
from db.application import Application

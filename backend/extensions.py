from flask_caching import Cache
from flask_mail import Mail

# init these here to avoid circular dependencies
mail = Mail()
cache = Cache()
